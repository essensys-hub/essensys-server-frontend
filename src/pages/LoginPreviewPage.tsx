import '../styles/auth-lan.css';
import { LoginVariantMaison } from '../components/Auth/LoginVariantMaison';
import { LoginVariantAurora } from '../components/Auth/LoginVariantAurora';

/** Aperçu des deux propositions login LAN (design review). */
export function LoginPreviewPage() {
  return (
    <div className="min-h-screen bg-[#0a0f18] text-white">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur px-4 py-3 text-center text-sm">
        Aperçu design —{' '}
        <a href="/login?variant=maison" className="text-[#00C9FF] underline">
          Proposition A
        </a>{' '}
        ·{' '}
        <a href="/login?variant=aurora" className="text-[#00C9FF] underline">
          Proposition B
        </a>
      </div>
      <section className="border-b border-white/10">
        <p className="px-4 py-2 text-xs uppercase tracking-widest text-white/50">A — Maison (fond photo)</p>
        <div className="h-[min(100dvh,900px)] overflow-hidden">
          <LoginVariantMaison />
        </div>
      </section>
      <section>
        <p className="px-4 py-2 text-xs uppercase tracking-widest text-white/50">B — Aurora (mesh + split desktop)</p>
        <div className="h-[min(100dvh,900px)] overflow-hidden">
          <LoginVariantAurora />
        </div>
      </section>
    </div>
  );
}
