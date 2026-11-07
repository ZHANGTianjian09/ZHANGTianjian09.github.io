export function translator(language = document.documentElement.lang) {
  const chinese = language.toLowerCase().startsWith('zh');
  return (english, simplifiedChinese) => chinese ? simplifiedChinese : english;
}
