function hasAllowedImageExtension(url) {
  const allowedDomains = ["img.hankyung.com"];
  const allowedExtensions = /\.(jpe?g|png)$/i;

  try {
    const parsedUrl = new URL(url);
    return (
      allowedDomains.includes(parsedUrl.hostname) && allowedExtensions.test(url)
    );
  } catch (err) {
    return false;
  }
}
module.exports = { hasAllowedImageExtension };
