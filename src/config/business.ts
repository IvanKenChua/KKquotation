/**
 * Public business contact details.
 *
 * These values were carried over from the existing Kenvas Kreative website
 * (C:\Projects\Kenvas_Kreative\src\data\site.js). Keep them here so they can be
 * updated in one place. No phone number is configured because none was present
 * in the source projects.
 */
export const business = {
  name: "KENVAS KREATIVE",
  tagline: "Every idea deserves a canvas.",
  email: "kenvaskreative@gmail.com",
  facebook: "https://www.facebook.com/KenvasKreative",
  location: "Philippines · working worldwide",
} as const;

export const hasEmail = business.email.trim().length > 0;
export const hasFacebook = business.facebook.trim().length > 0;
