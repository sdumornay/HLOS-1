// Entity filter/list calls made with an options object return a page
// ({ items, next_cursor, has_more }); calls without options return an array.
export const items = (res) => (Array.isArray(res) ? res : res?.items || []);