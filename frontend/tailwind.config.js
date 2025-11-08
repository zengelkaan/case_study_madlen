// tailwind.config.js - Tailwind CSS yapılandırması
// Utility-first CSS framework için özelleştirmeler

/** @type {import('tailwindcss').Config} */
export default {
  // Dark mode stratejisi - class-based (html tag'ine dark class eklendiğinde aktif olur)
  darkMode: 'class', // dark: prefix'li class'lar html.dark ile aktif olur
  
  // Tailwind'in hangi dosyalarda class araması yapacağını belirt
  content: [
    "./index.html", // Ana HTML dosyası
    "./src/**/*.{js,ts,jsx,tsx}", // Tüm src içindeki React dosyaları
  ],
  
  // Tema özelleştirmeleri
  theme: {
    extend: {
      // Özel renkler eklenebilir
      colors: {
        // Marka renkleri burada tanımlanabilir
        // primary: '#...',
        // secondary: '#...',
      },
      
      // Özel font ailesi
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Varsayılan sans-serif font
      },
      
      // Animasyon süreleri
      transitionDuration: {
        '400': '400ms', // Orta hızda animasyon
      },
    },
  },
  
  // Tailwind plugin'leri
  plugins: [
    require('@tailwindcss/typography'), // Typography plugin - prose class'ları için (markdown rendering)
  ],
}

