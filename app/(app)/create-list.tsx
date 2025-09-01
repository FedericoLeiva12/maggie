import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { createList } from '@/lib/listService';
import { useRouter } from 'expo-router';

export default function CreateListScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const C = Theme.colors.dark;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!user) return;
    if (!title.trim()) {
      Alert.alert(t('listCreate.missingTitleTitle'), t('listCreate.missingTitleMsg'));
      return;
    }
    setSubmitting(true);
    try {
      await createList(user.uid, { title: title.trim(), description: description.trim() || undefined });
      router.replace('/(app)');
    } catch (e) {
      console.error(e);
      Alert.alert('Ups', t('listCreate.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top','bottom']} style={[styles.container, { backgroundColor: C.background }]}> 
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityLabel="Volver"
        style={[
          styles.backButton,
          {
            top: insets.top + 8,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderColor: 'rgba(255,255,255,0.1)'
          },
        ]}
      >
        <Ionicons name="chevron-back" size={20} color={C.text} />
        <Text style={[styles.backText, { color: C.text }]}>Volver</Text>
      </TouchableOpacity>
      {/* ambient glows */}
      <View pointerEvents="none" style={[styles.glow, styles.glowTR, { backgroundColor: C.accent }]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBL, { backgroundColor: C.primary }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex1}>
        <View style={styles.header}> 
          <Text style={[styles.brand, { color: C.accent }]}>Maggie</Text>
          <Text style={[styles.title, { color: C.text }]}>{t('listCreate.title')}</Text>
          <Text style={[styles.subtitle, { color: C.muted }]}>{t('listCreate.subtitle')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.label, { color: C.muted }]}>{t('listCreate.name')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('listCreate.placeholderTitle')}
            placeholderTextColor={C.muted}
            style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.06)' }]}
            autoFocus
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: C.muted, marginTop: 12 }]}>{t('listCreate.description')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('listCreate.placeholderDescription')}
            placeholderTextColor={C.muted}
            style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.06)', height: 92, textAlignVertical: 'top' }]}
            multiline
          />

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSubmit}
            disabled={submitting}
            style={[styles.cta, { backgroundColor: C.primary, opacity: submitting ? 0.7 : 1 }]}
          >
            <Ionicons name="add" size={18} color={C.primaryText} />
            <Text style={[styles.ctaText, { color: C.primaryText }]}>
              {submitting ? t('listCreate.creating') : t('listCreate.create')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  flex1: { flex: 1 },
  header: { gap: 6, marginBottom: 12, marginTop: 44 },
  brand: { fontSize: 12, letterSpacing: 2, fontFamily: 'SpaceMono', textTransform: 'uppercase', opacity: 0.9 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14 },
  backButton: {
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
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 8,
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  label: { fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  cta: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ctaText: { fontSize: 16, fontWeight: '700' },
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
