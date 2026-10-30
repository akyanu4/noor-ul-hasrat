/* Noor settings. Fill these in after following SETUP.md. Leave a value empty to keep that feature switched off.
 * None of these are passwords: the Firebase address and the OneSignal app id are meant to be public.
 * Restrict the YouTube key to your website address in Google Cloud (SETUP.md, step 3). */
(self).NOOR_CONFIG = {
  firebaseApiKey: "AIzaSyC2DoJUQfk2NAOvBuD8ION65l7JyHfMU1g",
  rtdbUrl: "https://siddiqgulshan-25903-default-rtdb.firebaseio.com/",
  youtubeApiKey: "AIzaSyAzuzRf47bDVZnGhBLtFO-fjZYB2II4mYQ",
  youtubeChannelId: "UCatVsvcKbebBYtB6tyQdC2g",   // DAR UL ILM (@Darulilm1)
  halqaVideoUrl: "",
  // Google Meet room used for the halqa and every gathering (Meet cannot run inside an app frame; it opens in the Meet app or an in-app browser tab).
  meetUrl: "https://meet.google.com/mxc-pqnb-xba",
  halqaRoom: "NoorHalqaEZikr-BaitUnNoor",
  oneSignalAppId: "46d22dc3-ea76-4e2f-aaf7-1eeb250efa84",

  // Donate screen: paste the link to your donation page. Leave empty to show "coming soon".
  donateTitle: "Support the mission",
  donateUrl: "",
  donateNote: "",

  // Family YouTube channel for "Poetry & Naat" and "Dars & Tafseer" (uses youtubeApiKey).
  familyChannel: { id: "UCi1Sn0S3O29-Hw87RT_fOXw", name: "Shadman", url: "https://www.youtube.com/@Shadman-ob4wf" },

  // "Azam Pasha Zikr": Shorts from this channel are listed on his profile page and under Practices (uses youtubeApiKey).
  azamChannel: { id: "UCn5J7zggR3cV4sCYlEjgZJA", name: "Azam Pasha Zikr", url: "https://www.youtube.com/channel/UCn5J7zggR3cV4sCYlEjgZJA/shorts" },

  // Shaykh filters on the Dars & Tafseer screen. "match" is a word (or words separated by |) that appears in that shaykh's video titles.
  // Example: familyShaykhs: [ { name: "Shaykh Name", match: "Shaykh Name|short name" } ],
  familyShaykhs: [],

  shaykhPhotos: [
    { src: "photos/shaykh-1.jpg", name: "Azam Pasha", note: "Tap to watch zikr.", profile: "shaykh1" },
    { src: "photos/shaykh-2.jpg", name: "Hazrat Mohammed Abdul Qadeer Siddiqui (Hasrat)", note: "Bahr ul-Uloom, Hyderabad. Tap to read more.", profile: "hasrat" },
    { src: "photos/shaykh-3.jpg", name: "", note: "" }
  ]
};
