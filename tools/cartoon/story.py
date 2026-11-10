"""Pilot: "Ali and the Thirsty Cat" — an original kids' moral story (about 2.5 minutes).
Each shot: background, then beats. A beat is ("say", who, text) or ("wait", seconds) or ("sfx", name).
Who: N (narrator), ALI, MARYAM, NANA, CAT."""

TITLE = "Ali and the Thirsty Cat"
MORAL = ("Be kind to every living thing.", "Allah is kind, and He loves kindness.")

SHOTS = [
    ("title", [("wait", 1.0), ("say", "N", "Ali and the Thirsty Cat."), ("wait", 1.4)]),

    ("street", [
        ("say", "N", "It was a very hot summer day. The sun was shining bright, and everyone was looking for some shade."),
        ("wait", 0.4),
        ("say", "N", "Ali and his little sister Maryam were walking home from school."),
        ("wait", 0.3),
        ("say", "ALI", "Phew! It is so hot today, Maryam!"),
        ("say", "MARYAM", "I can't wait to get home and drink a big glass of cold lemonade!"),
        ("wait", 0.6),
    ]),

    ("tree", [
        ("sfx", "meow_weak"),
        ("wait", 0.5),
        ("say", "MARYAM", "Ali, look! A little cat under the tree."),
        ("say", "ALI", "She looks so tired. I think she is very thirsty. Poor kitty!"),
        ("sfx", "meow_weak"),
        ("wait", 0.6),
    ]),

    ("think", [
        ("say", "ALI", "But... this is the last bit of water in my bottle."),
        ("wait", 0.4),
        ("say", "N", "Ali was thirsty too. Then he remembered what his Nana always said."),
        ("wait", 0.3),
        ("say", "NANA", "Be kind to everyone, even to the animals. Allah is kind, and He loves kindness."),
        ("wait", 0.5),
    ]),

    ("pour", [
        ("say", "ALI", "Here you go, little kitty. Have some water!"),
        ("wait", 0.4),
        ("sfx", "lap"),
        ("wait", 2.6),
        ("say", "N", "The little cat drank and drank, until she was not thirsty anymore."),
        ("sfx", "purr"),
        ("say", "MARYAM", "Hee hee! She is saying thank you, Ali!"),
        ("sfx", "meow_happy"),
        ("wait", 0.8),
    ]),

    ("follow", [
        ("say", "N", "And guess what? The little cat would not leave them!"),
        ("wait", 0.3),
        ("sfx", "meow_happy"),
        ("say", "ALI", "Hey! Where are you going, kitty?"),
        ("wait", 1.2),
    ]),

    ("home", [
        ("say", "NANA", "Assalamu alaikum, my children! And who is this little guest?"),
        ("say", "ALI", "Wa alaikum assalam, Nana! She was so thirsty, so I gave her my water."),
        ("wait", 0.3),
        ("say", "NANA", "Masha'Allah, Ali! I am so proud of you. Our beloved Prophet, peace be upon him, taught us that there is a reward for kindness to every living thing."),
        ("wait", 0.3),
        ("sfx", "meow_happy"),
        ("say", "MARYAM", "Nana, can we keep her? Let's call her Lemonade!"),
        ("sfx", "laugh"),
        ("say", "NANA", "Ha ha ha! Lemonade it is!"),
        ("wait", 1.0),
    ]),

    ("moral", [("wait", 0.6), ("say", "N", "Be kind to every living thing. Allah is kind, and He loves kindness."), ("wait", 1.8)]),
    ("end", [("wait", 5.0)]),
]
