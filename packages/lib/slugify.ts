import { slugify as transliterateSlugify } from "transliteration";

// forDisplayingInput is used to allow user to type "-" at the end and not replace with empty space.
// For eg:- "test-slug" is the slug user wants to set but while typing "test-" would get replace to "test" becauser of replace(/-+$/, "")

export const slugify = (str: string, forDisplayingInput?: boolean) => {
  if (!str) {
    return "";
  }

  return transliterateSlugify(str);
};

export default slugify;
