"use client";
import { useEffect, useState } from "react";
const FORM_HEIGHT_PX = 520;
const EMBED_SRC = "https://link.msgsndr.com/js/form_embed.js";
export default function NewsletterSignup() {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [scriptFailed, setScriptFailed] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    useEffect(() => {
        const existingScript = document.querySelector(`script[src="${EMBED_SRC}"]`);
        if (existingScript) {
            setScriptLoaded(true);
            setIframeKey((prev) => prev + 1);
            return;
        }
        const scriptEl = document.createElement("script");
        scriptEl.src = EMBED_SRC;
        scriptEl.async = true;
        scriptEl.onload = () => {
            setScriptLoaded(true);
            setIframeKey((prev) => prev + 1);
        };
        scriptEl.onerror = () => setScriptFailed(true);
        document.body.appendChild(scriptEl);
        return () => {
            scriptEl.onload = null;
            scriptEl.onerror = null;
        };
    }, []);
    return (<section className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/30 py-16">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Stay Connected
          </h2>
          <p className="text-slate-600 text-lg">
            Get updates on mental health resources, therapy insights, and
            practice news
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 relative overflow-hidden" style={{ minHeight: FORM_HEIGHT_PX + 48 }}>
          {!scriptLoaded && !scriptFailed && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white/70 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-100 border-t-emerald-500"/>
              <p className="text-sm font-medium">Loading secure intake form…</p>
            </div>)}

          {scriptFailed && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-4 text-slate-600 bg-white/85 backdrop-blur">
              <p className="font-semibold">
                We couldn’t load the newsletter form right now.
              </p>
              <a href="https://api.leadconnectorhq.com/widget/form/ztlZAKN4mQJm8FeGz2LH" target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-full bg-emerald-600 text-white font-medium shadow-md hover:bg-emerald-700 transition">
                Open form in a new tab
              </a>
            </div>)}

          {scriptLoaded && !scriptFailed && (<div className="w-full" style={{ minHeight: FORM_HEIGHT_PX }}>
              <iframe key={iframeKey} src="https://api.leadconnectorhq.com/widget/form/ztlZAKN4mQJm8FeGz2LH" style={{
                width: "100%",
                height: `${FORM_HEIGHT_PX}px`,
                border: "none",
                borderRadius: "3px",
            }} id="inline-ztlZAKN4mQJm8FeGz2LH" data-layout='{"id":"INLINE"}' data-trigger-type="alwaysShow" data-trigger-value="" data-activation-type="alwaysActivated" data-activation-value="" data-deactivation-type="neverDeactivate" data-deactivation-value="" data-form-name="Website Intake" data-height="462" data-layout-iframe-id="inline-ztlZAKN4mQJm8FeGz2LH" data-form-id="ztlZAKN4mQJm8FeGz2LH" title="Website Intake" allow="clipboard-read; clipboard-write" loading="lazy"/>
            </div>)}
        </div>
      </div>
    </section>);
}
