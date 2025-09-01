import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';
import { useAuth } from '../../contexts/AuthContext';
import { getListsForUser, joinListByCode } from '../../lib/listService';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

type GroceryList = {
  id: string;
  title: string;
  description?: string;
  lastModified: string; // ISO date string
  itemsTotal: number;
  itemsDone: number;
  members: { id: string; name: string }[];
};

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const name = user?.displayName || user?.email || '';
  const router = useRouter();

  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const C = Theme.colors.dark; // lock to dark for visual consistency (app uses DarkTheme)

  const headerGreeting = useMemo(
    () => (name ? t('home.greeting', { name }) : t('home.greetingNoName')),
    [name, t]
  );

  const mapFromDoc = (d: any): GroceryList => ({
    id: d.id,
    title: d.title ?? '',
    description: d.description ?? undefined,
    lastModified:
      d.updatedAt && typeof d.updatedAt?.toDate === 'function'
        ? d.updatedAt.toDate().toISOString()
        : new Date().toISOString(),
    itemsTotal: Number(d.itemsTotal ?? 0),
    itemsDone: Number(d.itemsDone ?? 0),
    members: Array.isArray(d.members)
      ? d.members.map((uid: string) => ({ id: uid, name: uid.slice(0, 2) }))
      : [],
  });

  const fetchLists = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const docs = await getListsForUser(user.uid);
      setLists(docs.map(mapFromDoc));
    } catch (e) {
      console.error(e);
      Alert.alert('Ups', 'No pudimos cargar tus listas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push('/(app)/create-list');
  };

  const handleOpenJoin = () => {
    setJoinOpen(true);
    setJoinCode('');
  };

  const handleJoin = async () => {
    if (!user) return;
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert(t('home.joinInvalidTitle'), t('home.joinInvalidMessage'));
      return;
    }
    try {
      setJoining(true);
      const doc = await joinListByCode(code, user.uid);
      setJoinOpen(false);
      setJoinCode('');
      // Navigate directly to the list
      router.push(`/(app)/list/${doc.id}`);
    } catch (e: any) {
      console.error(e);
      const notFound = e?.message === 'NOT_FOUND';
      Alert.alert(t('home.joinFailedTitle'), notFound ? t('home.joinNotFound') : t('home.joinFailedMessage'));
    } finally {
      setJoining(false);
    }
  };

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchLists();
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    fetchLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchLists();
    }, [user?.uid])
  );

  const renderEmpty = () => (
    <View style={styles.centerWrap}>
      {/* Ambient glows */}
      <View style={[styles.glow, styles.glowTR, { backgroundColor: C.accent }]} />
      <View style={[styles.glow, styles.glowBL, { backgroundColor: C.primary }]} />

      {/* Empty illustration */}
      <View style={[styles.emojiWrap, { borderColor: 'rgba(255,255,255,0.08)' }]}>
        <Text style={styles.emoji}>🛒</Text>
      </View>
      <Text style={[styles.title, { color: C.text }]}>{t('home.emptyTitle')}</Text>
      <Text style={[styles.subtitle, { color: C.muted }]}>{t('home.emptySubtitle')}</Text>
      <TouchableOpacity activeOpacity={0.9} onPress={handleCreate} style={[styles.primaryCta, { backgroundColor: C.primary }]}> 
        <Ionicons name="add" size={18} color={C.primaryText} />
        <Text style={[styles.primaryCtaText, { color: C.primaryText }]}>{t('home.createFirst')}</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.9} onPress={handleOpenJoin} style={[styles.primaryCta, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }]}> 
        <Ionicons name="log-in" size={18} color={C.text} />
        <Text style={[styles.primaryCtaText, { color: C.text }]}>{t('home.join')}</Text>
      </TouchableOpacity>
    </View>
  );

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - d.getTime());
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) return `${diffMin}m`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH}h`;
      const diffD = Math.floor(diffH / 24);
      if (diffD < 7) return `${diffD}d`;
      // Short absolute fallback: 31 ago, 12:34
      return new Intl.DateTimeFormat('es', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
        .format(d)
        .replace('.', '');
    } catch {
      return iso;
    }
  };

  const renderItem = ({ item }: { item: GroceryList }) => {
    const progress = `${item.itemsDone}/${item.itemsTotal}`;
    const pct = Math.max(0, Math.min(1, item.itemsTotal ? item.itemsDone / item.itemsTotal : 0));
    const initials = (name: string) =>
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const shown = item.members.slice(0, 3);
    const extra = Math.max(0, item.members.length - shown.length);
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.card,
          { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
        ]}
        onPress={() => router.push(`/(app)/list/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.avatarsRow}>
            {shown.map((m, i) => (
              <View
                key={m.id}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: i % 2 === 0 ? 'rgba(99,102,241,0.24)' : 'rgba(34,211,238,0.24)',
                    borderColor: 'rgba(255,255,255,0.18)',
                    marginLeft: i === 0 ? 0 : -8,
                  },
                ]}
              >
                <Text style={[styles.avatarText, { color: C.text }]}>{initials(m.name)}</Text>
              </View>
            ))}
            {extra > 0 && (
              <View style={[styles.avatar, { marginLeft: shown.length ? -8 : 0, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }]}>
                <Text style={[styles.avatarText, { color: C.muted }]}>+{extra}</Text>
              </View>
            )}
          </View>
        </View>
        {!!item.description && (
          <Text style={[styles.cardDesc, { color: C.muted }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: C.success }]} />
        </View>

        {/* Meta chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="time" size={14} color={C.muted} />
            <Text style={[styles.chipText, { color: C.muted }]} numberOfLines={1}>
              {formatDate(item.lastModified)}
            </Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="checkbox" size={14} color={C.success} />
            <Text style={[styles.chipText, { color: C.muted }]} numberOfLines={1}>
              {t('home.itemsProgress', { progress })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}> 
      {/* Ambient glows to unify with empty state */}
      <View pointerEvents="none" style={[styles.glow, styles.glowTR, { backgroundColor: C.accent }]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBL, { backgroundColor: C.primary }]} />

      {/* Content */}
      {loading ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.subtitle, { color: C.muted }]}>Cargando…</Text>
        </View>
      ) : lists.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Text style={[styles.brand, { color: C.accent }]}>Maggie</Text>
              <Text style={[styles.headline, { color: C.text }]}>{headerGreeting}</Text>
              <Text style={[styles.subhead, { color: C.muted }]}>{t('home.yourLists')}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={handleCreate} activeOpacity={0.9} style={[styles.actionBtn, { backgroundColor: C.primary, borderColor: 'rgba(255,255,255,0.12)' }]}>
                  <Ionicons name="add" size={16} color={C.primaryText} />
                  <Text style={[styles.actionBtnText, { color: C.primaryText }]}>{t('home.createList')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleOpenJoin} activeOpacity={0.9} style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }]}>
                  <Ionicons name="log-in" size={16} color={C.text} />
                  <Text style={[styles.actionBtnText, { color: C.text }]}>{t('home.join')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* FABs when list exists */}
      {lists.length > 0 && (
        <>
          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.9}
            style={[styles.fab, { backgroundColor: C.primary, shadowColor: Theme.colors.dark.shadow }]}
            accessibilityLabel={t('home.addList')}
          >
            <Ionicons name="add" size={26} color={C.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenJoin}
            activeOpacity={0.9}
            style={[styles.fabSecondary, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
            accessibilityLabel={t('home.join')}
          >
            <Ionicons name="log-in" size={22} color={C.text} />
          </TouchableOpacity>
        </>
      )}

      {/* Join modal */}
      {joinOpen && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: 'rgba(17,17,17,0.98)', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>{t('home.joinTitle')}</Text>
            <Text style={[styles.modalSubtitle, { color: C.muted }]}>{t('home.joinSubtitle')}</Text>
            <TextInput
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              placeholder={t('home.joinPlaceholder')}
              placeholderTextColor={C.muted}
              style={[styles.modalInput, { color: C.text, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setJoinOpen(false)} style={[styles.modalBtn, { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[styles.modalBtnText, { color: C.text }]}>{t('home.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleJoin} disabled={joining} style={[styles.modalBtn, { backgroundColor: C.primary, opacity: joining ? 0.7 : 1 }]}>
                <Text style={[styles.modalBtnText, { color: C.primaryText }]}>{joining ? t('home.joining') : t('home.joinCta')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 6,
  },
  brand: {
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  headline: { fontSize: 22, fontWeight: '800' },
  subhead: { fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
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
  emojiWrap: {
    width: 92,
    height: 92,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 14,
  },
  emoji: { fontSize: 42 },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  primaryCta: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  primaryCtaText: { fontSize: 16, fontWeight: '700' },

  listContent: { padding: 16, paddingBottom: 120, gap: 12 },
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  cardDesc: { fontSize: 14, marginTop: 6 },
  meta: { fontSize: 12 },

  avatarsRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: { fontSize: 10, fontWeight: '700' },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 0,
    flexShrink: 1,
  },
  chipText: { fontSize: 12 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabSecondary: {
    position: 'absolute',
    right: 92,
    bottom: 28,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, marginBottom: 10 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, letterSpacing: 4, textAlign: 'center', fontWeight: '700', fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12, justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
});
