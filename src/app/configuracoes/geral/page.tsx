"use client";

import { Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

export default function GeralConfigPage() {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const g = t.settings.general;

  return (
    <div className="p-8 max-w-[900px]">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{g.title}</h2>
        </div>
        <p className="text-sm text-gray-400 ml-12">{g.subtitle}</p>
      </div>

      <div className="space-y-5">
        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{g.appearance}</h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.theme}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {g.currently} {theme === "dark" ? g.darkMode : g.lightMode}
                </p>
              </div>
              <button
                onClick={toggle}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === "dark" ? (
                  <><Sun className="h-4 w-4" />{g.lightMode}</>
                ) : (
                  <><Moon className="h-4 w-4" />{g.darkMode}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{g.language}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{g.languageSub}</p>
          </div>
          <div className="px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={() => setLang("pt")}
                className={cn(
                  "flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border-2 transition-all text-left",
                  lang === "pt"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <span className="text-2xl">🇧🇷</span>
                <div>
                  <p className={cn("text-sm font-semibold", lang === "pt" ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-gray-100")}>
                    {g.portuguese}
                  </p>
                  <p className="text-xs text-gray-400">Português (Brasil)</p>
                </div>
                {lang === "pt" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              <button
                onClick={() => setLang("en")}
                className={cn(
                  "flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border-2 transition-all text-left",
                  lang === "en"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <span className="text-2xl">🇺🇸</span>
                <div>
                  <p className={cn("text-sm font-semibold", lang === "en" ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-gray-100")}>
                    {g.english}
                  </p>
                  <p className="text-xs text-gray-400">English (US)</p>
                </div>
                {lang === "en" && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
