const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

// Desktop Admin logic removal
const desktopAdminStart = `
            ) : (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 transition-all hover:scale-[1.02]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Masuk Admin</span>
              </button>
            )}
`;
const desktopAdminEnd = `
            )}
`;
if (content.includes('Masuk Admin')) {
  content = content.replace(desktopAdminStart, desktopAdminEnd);
}

// Mobile Admin logic removal
const mobileAdminStart = `
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white shadow-md"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Portal Admin & Editor</span>
            </button>
            {currentUser && (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 text-rose-600 dark:bg-slate-800"
              >
                Logout / Keluar
              </button>
            )}
          </div>
`;

const mobileAdminEnd = `
          {currentUser && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Portal Admin & Editor</span>
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 text-rose-600 dark:bg-slate-800"
              >
                Logout / Keluar
              </button>
            </div>
          )}
`;
if (content.includes('Portal Admin & Editor')) {
  content = content.replace(mobileAdminStart, mobileAdminEnd);
}

fs.writeFileSync('src/components/Header.tsx', content);
