# Captions: each script line (script.md) split into chunks of (Urdu as narrated, short faithful English).
# Version 1 (script A/B) is bilingual. Version 2 (script A2/B2, everyday Urdu with English words) is English only, one
# short faithful line per sentence or clause (the Nastaliq font has no Latin letters, so the mixed Urdu-English cannot
# be shown in it); its Urdu slot is ''. Version 3 (the default) = version 2 plus the new lines (NEW_V3 below). A third item, where given, is the narration second the chunk starts (where the
# English length alone would put the change on the wrong words). NOOR_V=1 / NOOR_V=2 pick the earlier versions.
# The web address is written as it was read ("نورالحسرت ڈاٹ ورسل ڈاٹ ایپ"); the English line shows the address itself.
import os
URL_UR = 'نورالحسرت ڈاٹ ورسل ڈاٹ ایپ'
CAPTIONS_V1 = {
 'A': [
  [('بسم اللہ الرحمٰن الرحیم۔', 'In the name of Allah, the Most Gracious, the Most Merciful.')],
  [('نورالحسرت — آپ کا روحانی ساتھی۔', 'Noor-ul-Hasrat: your spiritual companion.')],
  [('یہاں نماز کے اوقات ہیں،', 'Here are the prayer times,'), ('قبلہ کی سمت ہے، اور اسلامی کیلنڈر بھی۔', 'the Qibla direction, and the Islamic calendar too.')],
  [('حضرت اعظم پاشاؒ کے درس اور شارٹس —', 'The dars and Shorts of Hazrat Azam Pasha R.A.'), ('ہر روز ایک نیا شارٹ، "آج کا شارٹ"۔', 'A new Short every day: "Short of the Day".')],
  [('سلسلہ وار درس، ترتیب سے دیکھیے —', 'Watch the dars series in order.'), ('جو دیکھ لیا، اس پر نشان لگ جاتا ہے۔', 'What you have watched gets a tick.')],
  [('صوفیانہ مراقبات —', 'Mystic Meditations:'), ('خطرات کو دور کرنے کے طریقے، تصویروں کے ساتھ۔', 'ways to drive away passing thoughts, with pictures.')],
  [('یہ اعمال بیعت کے بعد،', 'These practices, after Bai’at,'), ('شیخ کی رہنمائی میں فائدہ دیتے ہیں۔', 'bring benefit under the guidance of the Shaykh.')],
  [('بیعت کی درخواست ایپ ہی سے بھیجیے —', 'Send your request for Bai’at from the app itself.'), ('خلیفہ صاحب آپ سے رابطہ کریں گے، ان شاء اللہ۔', 'The Khalifa will contact you, in shaa Allah.')],
  [('ہفتہ وار حلقۂ ذکر میں آن لائن شامل ہوں،', 'Join the weekly Halqa-e-Zikr online,'), ('اور ایمان ہیلتھ سے اپنا حال دیکھیں۔', 'and see how you are doing with Iman Health.')],
  [('نورالحسرت — مفت ہے۔', 'Noor-ul-Hasrat is free.'), (URL_UR, 'noor-ul-hasrat.vercel.app')],
  [('آئیے، دل کو اللہ کی یاد سے روشن کریں۔', 'Come, let us light up the heart with the remembrance of Allah.')],
 ],
 'B': [
  [('السلام علیکم۔', 'Assalamu alaikum.'), ('نورالحسرت ایپ میں خوش آمدید۔', 'Welcome to the Noor-ul-Hasrat app.'), ('آئیے دیکھتے ہیں یہ ایپ کیسے استعمال کریں۔', 'Let us see how to use this app.')],
  [('ایپ انسٹال کرنا:', 'Installing the app:'), (URL_UR + ' کھولیں۔', 'open noor-ul-hasrat.vercel.app.'),
   ('اینڈرائیڈ پر "ایپ ڈاؤن لوڈ کریں" دبائیں،', 'On Android, tap "Download the app",'), ('یا براؤزر کے مینو سے "ہوم اسکرین میں شامل کریں"۔', 'or choose "Add to Home screen" in the browser menu.')],
  [('ہوم: سب سے اوپر آنے والی محفل یا حلقہ ہے —', 'Home: at the top is the coming mehfil or halqa.'), ('وقت ہو تو "آن لائن شامل ہوں" دبائیں۔', 'When it is time, tap "Join online".')],
  [('آج کا شارٹ، اور "یہاں سے شروع کریں" —', 'The Short of the Day, and "Start here":'), ('نئے آنے والوں کے لیے چند منتخب شارٹس، ترتیب سے۔', 'a few chosen Shorts for newcomers, in order.')],
  [('سلسلہ وار درس:', 'Dars in series:'), ('حقیقتِ بیعت اور نظام العملِ فقراء —', 'Haqeeqat-e-Bai’at and Nizam-ul-Amal-e-Fuqara.'), ('ہر حصہ ترتیب سے، اور ختم ہونے پر "اگلا" دبائیں۔', 'Each part in order; when one ends, tap "Next".')],
  [('موضوعات: توبہ، خطرات، تصور، صبر —', 'Topics: Tawbah, Khatrat, Tasawwur, Sabr.'), ('ایک لمس سے اسی موضوع کے شارٹس۔', 'One tap shows the Shorts on that topic.')],
  [('ہر شارٹ کو واٹس ایپ پر اپنے عزیزوں کو بھیجیں۔', 'Send any Short to your loved ones on WhatsApp.')],
  [('پریکٹسز میں سب سے اوپر "صوفیانہ مراقبات":', 'At the top of Practices: "Mystic Meditations".'), ('ہر موضوع کھولیں —', 'Open any topic:'), ('تصویر، حضرتؒ کے الفاظ میں طریقہ، اور متعلقہ شارٹ۔', 'a picture, the method in Hazrat’s words, and its Short.')],
  [('یاد رکھیے: یہ مراقبات بیعت کے بعد،', 'Remember: these meditations, after Bai’at,'), ('اپنے شیخ یا ان کے خلیفہ کی رہنمائی میں ہی فائدہ دیتے ہیں۔', 'bring benefit only under the guidance of your Shaykh or his Khalifa.')],
  [('بیعت لینا: مزید میں "بیعت" کھولیں۔', 'Taking Bai’at: open "Bay’ah" in More.'), ('حضرتؒ کی زبانی بیعت کے مراحل دیکھیں۔', 'See the steps of Bai’at in Hazrat’s own words.')],
  [('"بیعت کی درخواست":', '"Request to take Bai’at":'), ('مفت اکاؤنٹ بنائیں —', 'make a free account,'), ('صرف ای میل، کوئی پاس ورڈ نہیں۔', 'just your email, no password.'),
   ('ای میل میں آیا لنک کھولیں،', 'Open the link that comes in the email,'), ('پھر شیخ یا خلیفہ چنیں،', 'then choose the Shaykh or Khalifa,'), ('موبائل نمبر لکھیں، اور درخواست بھیج دیں۔', 'write your mobile number, and send the request.')],
  [('میرا اکاؤنٹ: اگر آپ بیعت لے چکے ہیں تو یہاں نشان لگائیں۔', 'My Account: if you have already taken Bai’at, mark it here.'), ('منظوری کے بعد مکمل درس اور اذکار کے شارٹس کھل جاتے ہیں۔', 'After approval, the full dars and the dhikr Shorts open.')],
  [('ایمان ہیلتھ: نماز، ذکر اور روزے کا روزانہ حساب —', 'Iman Health: a daily record of prayer, dhikr and fasting.'), ('اپنے ایمان کا حال دیکھیں۔', 'See the state of your iman.')],
  [('تسبیح، دعائیں، نماز کے اوقات،', 'Tasbeeh, duas, prayer times,'), ('قبلہ اور اسلامی کیلنڈر — سب ایک جگہ۔', 'the Qibla and the Islamic calendar: all in one place.')],
  [('اطلاعات آن کریں،', 'Turn on notifications,'), ('تاکہ حلقے اور محفل کی یاد دہانی مل جائے۔', 'so you get reminders for the halqa and the mehfil.')],
  [('نورالحسرت — مفت، اور سب کے لیے۔', 'Noor-ul-Hasrat: free, and for everyone.'), ('اللہ ہم سب کے دلوں کو اپنی یاد سے آباد رکھے۔ آمین۔', 'May Allah keep all our hearts alive with His remembrance. Ameen.')],
 ],
}

def _en(*lines): return [('', e) if isinstance(e, str) else ('', e[0], e[1]) for e in lines]
CAPTIONS_V2 = {
 'A': [
  _en('In the name of Allah, the Most Gracious, the Most Merciful.'),
  _en('The Noor-ul-Hasrat app: your spiritual companion.'),
  _en('It has Prayer Times, a Qibla finder,', ('and an Islamic Calendar too.', 10.32)),
  _en('Dars and Shorts of Hazrat Azam Pasha R.A.,', 'a new Short of the Day, every day.'),
  _en('Watch the Series in order;', 'what you have watched gets a tick.'),
  _en('Mystic Meditations: ways to drive away passing thoughts, with pictures.'),
  _en('These practices help after Bai’at,', ('under the guidance of the Shaykh.', 28.4)),
  _en('Send your Bai’at request from the app itself.', 'The Khalifa will contact you, in shaa Allah.'),
  _en('Every Saturday, join the halqa-e-zikr online,', 'and check your state with Iman Health.'),
  _en('Noor-ul-Hasrat is completely free.'),
  _en('Come, let us light up the heart with the remembrance of Allah.'),
 ],
 'B': [
  _en('Assalamu alaikum.', 'Welcome to the Noor-ul-Hasrat app.', 'Let us see how to use the app.'),
  _en('To install, open noor-ul-hasrat.vercel.app in the browser.', 'On Android, tap Download app,', ('or choose Add to Home screen in the browser menu.', 12.75)),
  _en('On Home, the next mehfil or halqa is at the top;', 'when it is time, tap Join online.'),
  _en('Then the Short of the Day, and Start here:', 'a few chosen Shorts for newcomers, in order.'),
  _en('In Series, the parts of Haqeeqat-e-Bai’at and Nizam-ul-Amal are in order.', 'When a Short ends, tap Next.'),
  _en('Topics like Tawbah, Khatrat, Tasawwur, Sabr:', ('one tap shows the Shorts on that topic.', 37.07)),
  _en('Share any Short on WhatsApp.'),
  _en('At the top of Practices: Mystic Meditations.', 'Open a topic:', 'a picture, the method in Hazrat’s words, and its Short.'),
  _en('Remember, these meditations help only after Bai’at,', 'under the guidance of your Shaykh or Khalifa.'),
  _en('For Bai’at, open Bai’at in More,', ('and see all the steps in Hazrat’s own words.', 56.57)),
  _en('Tap Request to take Bai’at and make a free account:', ('just an email, no password.', 62.22), ('Open the link that comes in the email,', 63.54),
      'choose the Shaykh or Khalifa, write your mobile number,', 'and send the request.'),
  _en('In My Account, tick if you have already taken Bai’at;', 'after approval, the members’ videos open.'),
  _en('Iman Health: a daily record of namaz, zikr and fasting.', 'See the state of your iman.'),
  _en('Tasbeeh, Duas, Prayer Times, Qibla finder and Islamic Calendar:', 'all in one place.'),
  _en('Turn on notifications', 'to get reminders for the halqa and the mehfil.'),
  _en('Noor-ul-Hasrat is completely free, for everyone.', 'May Allah keep all our hearts alive with His remembrance. Ameen.'),
 ],
}

# Version 3 (script.md "# Version 3"): the version 2 captions, with their hand-set starts moved as far as their line moved
# in the spliced narration (work/order_<S>.json, times_v2_<S>.json, times_<S>.json from align.py), and the new lines.
# Hand-set starts of new lines are version 3 seconds: the pauses inside them (silencedetect -36 dB, d 0.12).
NEW_V3 = {
 'A6': _en('Read the Quran on tajweed pages,', ('bookmark a page,', 25.56), ('and listen to the recitation as the pages turn.', 26.99)),
 'A7': _en('Tasbeeh, and Collective dhikr:', ('see the whole community’s total.', 32.15), ('Every tap counts.', 34.57)),
 'A12': _en('Free account:', ('gifts, rewards and discounts from vendors for members, in shaa Allah.', 57.62)),
 'B11b': _en('Free account:', ('gifts, rewards and discounts from vendors for members, in shaa Allah.', 72.05)),
 'B14a': _en('The Quran: a 13-line tajweed mushaf.', ('Choose a Surah or Juz, bookmark a page,', 91.62), ('and see your streak in Progress.', 96.33)),
 'B14b': _en('Tap the headphones to listen to Mishary Alafasy or Maher Al-Muaiqly;', ('the pages turn with the recitation.', 103.29)),
 'B14c': _en('Tasbeeh: count your dhikr,', ('and see the whole community’s total in Collective dhikr.', 108.43), ('Every tap counts.', 112.46)),
 'B14d': _en('Duas, Prayer Times, Qibla finder and the Islamic Calendar,', ('all in one place.', 119.88)),
}
def _v3(sec):
    import json
    W = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'work'); J = lambda n: json.load(open(os.path.join(W, n + '.json')))
    order, t2, t3 = J('order_' + sec), J('times_v2_' + sec), J('times_' + sec); out = []
    for k, x in enumerate(order):
        if isinstance(x, str): out.append(NEW_V3[x]); continue
        d = t3[k][0] - t2[x - 1][0]
        out.append([c if len(c) < 3 else (c[0], c[1], round(c[2] + d, 2)) for c in CAPTIONS_V2[sec][x - 1]])
    return out
V = os.environ.get('NOOR_V', '3')
CAPTIONS = CAPTIONS_V1 if V == '1' else CAPTIONS_V2 if V == '2' else {'A': _v3('A'), 'B': _v3('B')}
