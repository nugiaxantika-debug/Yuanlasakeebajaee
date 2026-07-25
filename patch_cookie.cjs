const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');
const searchString = `      )}
      </div>
    </div>
  );
}`;
const replaceString = `      )}

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className={\`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl p-6 \${
          webConfig.cookieBannerSize === 'small' ? 'md:max-w-xs' :
          webConfig.cookieBannerSize === 'large' ? 'md:max-w-lg' :
          'md:max-w-sm'
        } animate-in slide-in-from-bottom-5 duration-300\`}>
          <div className="flex flex-col gap-4">
            <p className={\`text-neutral-600 dark:text-neutral-400 \${
              webConfig.cookieBannerSize === 'small' ? 'text-xs' :
              webConfig.cookieBannerSize === 'large' ? 'text-base' :
              'text-sm'
            }\`}>
              {webConfig.cookieBannerText || "Kami menggunakan cookie untuk memastikan Anda mendapatkan pengalaman terbaik di situs web kami."}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  localStorage.setItem('cookie_accepted_at', new Date().getTime().toString());
                  setShowCookieBanner(false);
                }}
                className={\`bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold rounded-xl transition-colors \${
                  webConfig.cookieBannerSize === 'small' ? 'px-4 py-1.5 text-xs' :
                  webConfig.cookieBannerSize === 'large' ? 'px-6 py-3 text-base' :
                  'px-5 py-2 text-sm'
                }\`}
              >
                {webConfig.cookieBannerButtonText || "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}`;
content = content.replace(searchString, replaceString);
fs.writeFileSync('src/pages/Landing.tsx', content);
