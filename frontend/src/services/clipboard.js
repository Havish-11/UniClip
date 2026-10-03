export async function readClipboard() {
  if (!navigator.clipboard?.readText) throw new Error('UNSUPPORTED');
  try {
    return await navigator.clipboard.readText();
  } catch (err) {
    throw new Error(err.name === 'NotAllowedError' ? 'PERMISSION_DENIED' : 'READ_FAILED');
  }
}

export async function writeClipboard(text){
    try{
        await navigator.clipboard.writeText(text);
    }catch{
        const ta = document.createElement('textarea');
        ta.value=text;
        ta.style.cssText='position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }
}