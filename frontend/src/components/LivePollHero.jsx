import React from 'react';
import LivePoll from './LivePoll';

export default function LivePollHero({ electionId, title }) {
  return (
    <section className="mx-auto max-w-4xl p-4">
      <div className="bg-gradient-to-r from-pink-50 via-orange-50 to-yellow-50 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{title || 'Live AI Winner Prediction'}</h2>
            <p className="text-sm text-slate-600 mt-2">This panel shows the model's current prediction based on social engagement. It updates automatically.</p>
            <div className="mt-4">
              <LivePoll electionId={electionId} refreshInterval={4000} />
            </div>
          </div>
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl bg-white/60 flex items-center justify-center">
            <img src="/ai_icon.png" alt="AI" className="w-24 h-24 object-contain" />
          </div>
        </div>
      </div>
    </section>
  );
}
