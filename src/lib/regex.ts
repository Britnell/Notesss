export const regHeading = /^(\#{1,3})\s(.+)$/;
export const regList = /^\s?[-*]\s(.*)$/;
export const regTodo = /^-\[([x ]?)\]\s+(.+)$/;

export const regHabit = /\B\[([A-Z][a-z]*)(\d*)\]\B/;
export const regHabits = /\B\[([A-Z][a-z]*)(\d*)\]\B/g;

export const regTag = /\B\#(\w+)/;
export const regTags = /\B\#\w+/g;

export const regLink = /\[([^\]]+)\]\(([^)]+)\)/;
export const regLinks = /\[([^\]]+)\]\(([^)]+)\)/g;

export const regBold = /\*\*(\w+(?:\s\w+)*)\*\*/;
export const regitalic = /\*(\w+(?:\s\w+)*)\*/;
