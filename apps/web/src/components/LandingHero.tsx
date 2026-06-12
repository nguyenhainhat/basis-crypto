import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Award, Send, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LandingHero() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 inline-flex rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400 ring-1 ring-indigo-500/20 ring-inset">
        {t('landingHero.badge')}
      </div>
      <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
        {t('landingHero.title')}
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-zinc-400">
        {t('landingHero.subtitle')}
      </p>
      <div className="mt-10 flex justify-center">
        <ConnectButton showBalance={true} />
      </div>

      {/* Quick Feature Grid */}
      <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="glass glass-hover p-6 rounded-2xl text-left">
          <div className="mb-3 text-indigo-400"><Award className="h-6 w-6" /></div>
          <h3 className="text-base font-semibold text-white">{t('landingHero.features.sbt.title')}</h3>
          <p className="mt-2 text-sm text-zinc-400">{t('landingHero.features.sbt.description')}</p>
        </div>
        <div className="glass glass-hover p-6 rounded-2xl text-left">
          <div className="mb-3 text-indigo-400"><Send className="h-6 w-6" /></div>
          <h3 className="text-base font-semibold text-white">{t('landingHero.features.kudos.title')}</h3>
          <p className="mt-2 text-sm text-zinc-400">{t('landingHero.features.kudos.description')}</p>
        </div>
        <div className="glass glass-hover p-6 rounded-2xl text-left">
          <div className="mb-3 text-indigo-400"><Clock className="h-6 w-6" /></div>
          <h3 className="text-base font-semibold text-white">{t('landingHero.features.siwe.title')}</h3>
          <p className="mt-2 text-sm text-zinc-400">{t('landingHero.features.siwe.description')}</p>
        </div>
      </div>
    </div>
  );
}
