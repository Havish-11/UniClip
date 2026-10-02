// Checks whether the content is a link or a text

export function detectKind(content){
    const val = content.trim();

    if(/\s/.test(val)) return 'text'; //checks for any whitespace character
    try{
        const {protocol} = new URL(val); // parses into URL
        return protocol === 'http:' || protocol === 'https:' ? 'link' : 'text';
    }catch{
        return 'text';
    }
}