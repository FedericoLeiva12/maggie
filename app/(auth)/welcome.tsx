import { Theme } from '@/constants/Theme';
import { Link } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Fresh, dark, elegant welcome screen
// Built from scratch to create a premium first impression.

export function useWelcomeColors() {
  return {
    text: Theme.colors.dark.text,
    muted: Theme.colors.dark.muted,
    primary: Theme.colors.dark.primary,
    primaryText: Theme.colors.dark.primaryText,
    border: Theme.colors.dark.border,
    accent: Theme.colors.dark.accent,
    background: Theme.colors.dark.background,
  };
}

export default function Welcome() {
  const { t } = useTranslation();
  const colors = useWelcomeColors();
  return (
    <SafeAreaView edges={['top','bottom']} style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Ambient glows */}
      <View style={[styles.glow, styles.glowTR, { backgroundColor: colors.accent }]} />
      <View style={[styles.glow, styles.glowBL, { backgroundColor: colors.primary }]} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.brand, { color: colors.accent }]}>Maggie</Text>
        <Text style={[styles.headline, { color: colors.text }]}>{t('welcome.headline')}</Text>
        <Text style={[styles.subheadline, { color: colors.muted }]}>{t('welcome.subheadline')}</Text>
      </View>

      {/* Glass highlight with features */}
      <BlurView intensity={Platform.OS === 'ios' ? 50 : 25} tint="dark" style={styles.glass}>
        <Text style={[styles.body, { color: colors.muted }]}>{t('welcome.body')}</Text>
        <View style={styles.pills}>
          <Pill icon="🗂️" label={t('welcome.featureLists')} />
          <Pill icon="👥" label={t('welcome.featureCollaborate')} />
          <Pill icon="🔗" label={t('welcome.featureShare')} />
        </View>
      </BlurView>

      {/* CTA */}
      <Link asChild href="/(auth)/sign-in">
        <TouchableOpacity activeOpacity={0.9} style={[styles.cta, { backgroundColor: colors.primary }]}> 
          <Text style={[styles.ctaText, { color: colors.text }]}>{t('welcome.primaryCta')}</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 360,
    opacity: 0.22,
    filter: Platform.OS === 'web' ? 'blur(72px)' : undefined,
  },
  glowTR: {
    top: -80,
    right: -80,
  },
  glowBL: {
    bottom: -100,
    left: -100,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 18,
    letterSpacing: 2,
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  headline: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subheadline: {
    marginTop: 6,
    fontSize: 16,
    textAlign: 'center',
  },
  glass: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  pills: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillIcon: {
    fontSize: 16,
  },
  pillText: {
    fontSize: 14,
    color: '#C9CED6',
    maxWidth: 180,
  },
  cta: {
    paddingVertical: 16,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    shadowColor: Theme.colors.dark.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SpaceMono',
  },
});
