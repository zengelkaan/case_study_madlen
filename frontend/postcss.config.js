// postcss.config.js - PostCSS yapılandırması
// CSS'i işlemek ve dönüştürmek için kullanılan araç

export default {
  // PostCSS plugin'leri
  plugins: {
    // Tailwind CSS - utility class'ları üret
    tailwindcss: {},
    
    // Autoprefixer - tarayıcı uyumluluğu için CSS prefix'leri ekle
    // Örnek: display: flex -> -webkit-box, -ms-flexbox, display: flex
    autoprefixer: {},
  },
}

