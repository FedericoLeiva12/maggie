import { Theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
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
import { useAuth } from '../../contexts/AuthContext';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { signInWithEmail, registerWithEmail, sendPasswordReset } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'register'>('signIn');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.missingInfoTitle'), t('auth.missingInfoMessage'));
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert(t('auth.authFailedTitle'), e?.message || t('auth.unknownError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      Alert.alert(t('auth.enterEmailTitle'), t('auth.enterEmailMessage'));
      return;
    }
    try {
      await sendPasswordReset(email);
      Alert.alert(t('auth.emailSentTitle'), t('auth.emailSentMessage'));
    } catch (e: any) {
      Alert.alert(t('auth.resetFailedTitle'), e?.message || t('auth.unknownError'));
    }
  };

  const C = Theme.colors.dark; // lock to dark palette for best contrast

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: C.background }]}> 
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.replace('/(auth)/welcome')}
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

      {/* Ambient glows for depth */}
      <View style={[styles.glow, styles.glowTR, { backgroundColor: C.accent }]} />
      <View style={[styles.glow, styles.glowBL, { backgroundColor: C.primary }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
        keyboardVerticalOffset={24}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.brand, { color: C.accent }]}>Maggie</Text>
          <Text style={[styles.title, { color: C.text }]}>
            {mode === 'signIn' ? t('auth.signIn') : t('auth.createAccount')}
          </Text>
        </View>

        {/* Card */}
        <BlurView tint="dark" intensity={Platform.OS === 'ios' ? 50 : 25} style={styles.card}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: C.muted }]}>{t('auth.email')}</Text>
            <TextInput
              style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.06)' }]}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email')}
              placeholderTextColor={C.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCorrect={false}
              inputMode="email"
              keyboardAppearance="dark"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: C.muted }]}>{t('auth.password')}</Text>
            <TextInput
              style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.06)' }]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password')}
              placeholderTextColor={C.muted}
              secureTextEntry
              textContentType="password"
              keyboardAppearance="dark"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {mode === 'signIn' && (
            <TouchableOpacity onPress={handleReset}>
              <Text style={[styles.link, { color: C.link }]}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.cta, { backgroundColor: C.primary, opacity: submitting ? 0.7 : 1 }]}
          >
            <Text style={[styles.ctaText, { color: C.primaryText }]}>
              {submitting ? t('auth.pleaseWait') : mode === 'signIn' ? t('auth.signIn') : t('auth.register')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'signIn' ? 'register' : 'signIn')}>
            <Text style={[styles.toggle, { color: C.muted }]}>
              {mode === 'signIn' ? t('auth.toggleToRegister') : t('auth.toggleToSignIn')}
            </Text>
          </TouchableOpacity>
        </BlurView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  flex1: { flex: 1, justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 320,
    opacity: 0.22,
    filter: Platform.OS === 'web' ? 'blur(72px)' : undefined,
  },
  glowTR: { top: -80, right: -80 },
  glowBL: { bottom: -100, left: -100 },
  header: { alignItems: 'center', marginBottom: 16 },
  backButton: {
    position: 'absolute',
    top: 12,
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
  brand: { fontSize: 16, letterSpacing: 2, fontFamily: 'SpaceMono', textTransform: 'uppercase', opacity: 0.9 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 12,
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  field: { gap: 8 },
  label: { fontSize: 14 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  link: { marginTop: 6, fontWeight: '600' },
  cta: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  ctaText: { fontSize: 16, fontWeight: '700', fontFamily: 'SpaceMono' },
  toggle: { marginTop: 10, textAlign: 'center' },
});
