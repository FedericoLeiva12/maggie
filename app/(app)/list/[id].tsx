import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  addItem,
  incrementAmount,
  listenItems,
  removeItem,
  toggleItemDone,
  updateItem,
} from '@/lib/listItemsService';
import { listenList } from '@/lib/listService';
import type { ListItemDoc } from '@/models/listItem';

type Item = ListItemDoc & { id: string };

export default function ListDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = Theme.colors.dark;

  const [list, setList] = useState<any | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Subscribe to list metadata
  useEffect(() => {
    if (!id) return;
    const unsub = listenList(String(id), (data) => setList(data));
    return unsub;
  }, [id]);

  // Subscribe to items
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = listenItems(String(id), (rows) => {
      setItems(rows);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const title = list?.title ?? t('listDetails.untitled');
  const progress = useMemo(() => {
    const total = Number(list?.itemsTotal ?? items.length);
    const done = Number(list?.itemsDone ?? items.filter((i) => i.done).length);
    return { done, total };
  }, [list?.itemsTotal, list?.itemsDone, items]);

  const handleAdd = async () => {
    const name = inputText.trim();
    if (!user || !id || !name) return;
    try {
      await addItem(String(id), user.uid, name, 1);
      setInputText('');
      // keep focus for fast entry
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (e) {
      console.error(e);
      Alert.alert(t('listDetails.error'), t('listDetails.addError'));
    }
  };

  const handleShare = async () => {
    if (!id) return;
    const code: string | undefined = list?.code || undefined;
    if (!code) {
      Alert.alert(t('listDetails.error'), t('listDetails.shareError'));
      return;
    }
    // Web: copy to clipboard
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any)?.clipboard?.writeText) {
      try {
        await (navigator as any).clipboard.writeText(code);
        Alert.alert(t('listDetails.codeCopiedTitle'), t('listDetails.codeCopiedMsg'));
        return;
      } catch {}
    }
    // Native: use system share sheet to share the code text
    try {
      await Share.share({ message: code });
    } catch (e) {
      console.error(e);
      Alert.alert(t('listDetails.error'), t('listDetails.shareError'));
    }
  };

  const onToggle = async (item: Item) => {
    if (!id) return;
    try {
      await toggleItemDone(String(id), item.id, !item.done);
    } catch (e) {
      console.error(e);
    }
  };

  const onInc = (item: Item, delta: number) => incrementAmount(String(id), item.id, delta).catch(() => {});
  const onEditTitle = (item: Item, next: string) =>
    updateItem(String(id), item.id, { title: next.trim() || item.title }).catch(() => {});
  const onRemove = (item: Item) =>
    removeItem(String(id), item.id).catch(() => Alert.alert(t('listDetails.error'), t('listDetails.removeError')));

  const renderItem = ({ item }: { item: Item }) => {
    return (
      <View
        style={[
          styles.row,
          { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
        ]}
      >
        <TouchableOpacity
          onPress={() => onToggle(item)}
          accessibilityLabel={item.done ? t('listDetails.markUndone') : t('listDetails.markDone')}
          style={[styles.check, { borderColor: item.done ? C.success : C.border, backgroundColor: item.done ? 'rgba(74,222,128,0.18)' : 'transparent' }]}
        >
          {item.done && <Ionicons name="checkmark" size={16} color={C.success} />}
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <TextInput
            defaultValue={item.title}
            onEndEditing={(e) => onEditTitle(item, e.nativeEvent.text)}
            style={[styles.title, { color: item.done ? C.muted : C.text, textDecorationLine: item.done ? 'line-through' : 'none' }]}
            returnKeyType="done"
            blurOnSubmit
          />
          <Text style={[styles.subtitle, { color: C.muted }]}>
            {t('listDetails.amount', { amount: item.amount })}
          </Text>
        </View>

        <View style={styles.qtyControls}>
          <TouchableOpacity onPress={() => onInc(item, -1)} style={[styles.qtyBtn, { borderColor: 'rgba(255,255,255,0.12)' }]}> 
            <Ionicons name="remove" size={16} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: C.text }]}>{item.amount}</Text>
          <TouchableOpacity onPress={() => onInc(item, 1)} style={[styles.qtyBtn, { borderColor: 'rgba(255,255,255,0.12)' }]}> 
            <Ionicons name="add" size={16} color={C.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onRemove(item)} style={[styles.trashBtn, { borderColor: 'rgba(255,255,255,0.12)' }]}> 
          <Ionicons name="trash" size={16} color={C.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top','bottom']} style={[styles.container, { backgroundColor: C.background }]}> 
      {/* Back */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}
      >
        <Ionicons name="chevron-back" size={20} color={C.text} />
        <Text style={[styles.backText, { color: C.text }]}>{t('listDetails.back')}</Text>
      </TouchableOpacity>

      {/* Share/Invite */}
      <TouchableOpacity
        onPress={handleShare}
        style={[styles.inviteBtn, { top: insets.top + 8, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}
      >
        <Ionicons name="share-social" size={18} color={C.text} />
        <Text style={[styles.inviteText, { color: C.text }]}>{t('listDetails.invite')}</Text>
      </TouchableOpacity>

      {/* Ambient glows */}
      <View pointerEvents="none" style={[styles.glow, styles.glowTR, { backgroundColor: C.accent }]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBL, { backgroundColor: C.primary }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex1}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.brand, { color: C.accent }]}>Maggie</Text>
          <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
            {title}
          </Text>
          {!!list?.description && (
            <Text style={[styles.subtitle, { color: C.muted }]} numberOfLines={3}>
              {list.description}
            </Text>
          )}
          <View style={styles.chipsRow}>
            <View style={[styles.chip, { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }]}>
              <Ionicons name="checkbox" size={14} color={C.success} />
              <Text style={[styles.chipText, { color: C.muted }]}>
                {t('listDetails.progress', { done: progress.done, total: progress.total })}
              </Text>
            </View>
          </View>
        </View>

        {/* Items */}
        {loading ? (
          <View style={styles.centerWrap}>
            <Text style={[styles.subtitle, { color: C.muted }]}>{t('listDetails.loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Add item input bar */}
        <View style={[styles.addBar, { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }]}> 
          <Ionicons name="add" size={18} color={C.muted} />
          <TextInput
            ref={inputRef}
            placeholder={t('listDetails.addPlaceholder')}
            placeholderTextColor={C.muted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            style={[styles.addInput, { color: C.text }]}
          />
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: C.primary, borderColor: 'rgba(255,255,255,0.12)' }]}
          >
            <Text style={[styles.addBtnText, { color: C.primaryText }]}>{t('listDetails.add')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  flex1: { flex: 1 },
  header: { gap: 6, marginBottom: 8, marginTop: 44 },
  brand: { fontSize: 12, letterSpacing: 2, fontFamily: 'SpaceMono', textTransform: 'uppercase', opacity: 0.9 },
  subtitle: { fontSize: 14 },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 120, gap: 10 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', paddingVertical: Platform.OS === 'ios' ? 6 : 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyText: { minWidth: 24, textAlign: 'center', fontWeight: '700' },
  trashBtn: { marginLeft: 6, width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12 },

  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  addInput: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 10 : 6 },
  addBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  addBtnText: { fontSize: 14, fontWeight: '700' },

  backBtn: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  backText: { fontSize: 14, fontWeight: '600' },

  inviteBtn: {
    position: 'absolute',
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  inviteText: { fontSize: 14, fontWeight: '600' },

  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 320,
    opacity: 0.18,
    filter: Platform.OS === 'web' ? 'blur(64px)' : undefined,
  },
  glowTR: { top: -70, right: -70 },
  glowBL: { bottom: -90, left: -90 },
});
