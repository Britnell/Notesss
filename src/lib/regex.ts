export const regHeading = /^(\#{1,3})\s(.+)$/;
export const regList = /^\s?[-*]\s(.*)$/;
export const regTodo = /^-\[([x ]?)\]\s+(.+)$/;

export const regHabit = /(?:^|\s)\[([A-Za-z][a-z]*)(\d*)\]\B/;
export const regHabits = /(?:^|\s)\[([A-Za-z][a-z]*)(\d*)\]\B/g;

export const regTag = /\B\#(\w+)/;
export const regTags = /\B\#\w+/g;

export const regMention = /\B\@(\w+)/;
export const regMentions = /\B\@\w+/g;

export const regLink = /\[([^\]]+)\]\(([^)]+)\)/;
export const regLinks = /\[([^\]]+)\]\(([^)]+)\)/g;

export const regBold = /\*\*(\w+(?:\s\w+)*)\*\*/;
export const regitalic = /\*(\w+(?:\s\w+)*)\*/;
