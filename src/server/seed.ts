import type { Database } from "./db";
import { hashPassword } from "./password";
import { photos } from "@/lib/catalog";
export async function seed(db: Database) {
  if (
    (await db.query("SELECT id FROM users WHERE id=$1", ["u-customer"])).rows
      .length
  )
    return;
  await db.transaction(async (tx) => {
    const password = hashPassword("UtsavDemo2026!");
    const people = [
      ["customer", "Ananya Reddy"],
      ["vendor", "Arjun Rao"],
      ["planner", "Meera Shah"],
      ["operations", "Sravani Rao"],
      ["reviewer", "Vikram Patel"],
      ["support", "Riya Das"],
      ["finance", "Kiran Kumar"],
      ["admin", "Platform Admin"],
    ];
    for (const [role, name] of people)
      await tx.query(
        "INSERT INTO users(id,name,email,password_hash,role,city) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
        [`u-${role}`, name, `${role}@utsav.local`, password, role, "Hyderabad"],
      );
    const businesses = [
      [
        "b-1",
        "u-vendor",
        "The Bloom Atelier",
        "vendor",
        "Decoration",
        "Hyderabad",
        "Thoughtful flowers. Beautiful beginnings.",
        18500,
        photos.decor,
        "Seasonal florals, thoughtful details and spaces that feel unmistakably yours. Our intimate celebrations are designed with care.",
      ],
      [
        "b-2",
        "u-vendor",
        "Saffron Table",
        "vendor",
        "Catering",
        "Hyderabad",
        "Food that brings everyone together.",
        650,
        photos.food,
        "Regional menus and warm hospitality for celebrations of every size. Choose your menu, service style and final guest count.",
      ],
      [
        "b-3",
        "u-planner",
        "Gather & Grace",
        "planner",
        "Planning",
        "Hyderabad",
        "You make memories. We make it happen.",
        35000,
        photos.photo,
        "A considered planning service for joyful family celebrations, from the first idea to the final farewell.",
      ],
      [
        "b-4",
        "u-vendor",
        "The Glasshouse",
        "vendor",
        "Venues",
        "Hyderabad",
        "A little magic, a beautiful setting.",
        65000,
        photos.venue,
        "An airy setting for intimate gatherings, with flexible layouts and room for your celebration to unfold.",
      ],
      [
        "b-5",
        "u-vendor",
        "Little Joy Studio",
        "vendor",
        "Decoration",
        "Nellore",
        "Big smiles. Little details.",
        12500,
        photos.party,
        "Playful birthday styling and personalized backdrops, thoughtfully assembled by a local creative team.",
      ],
      [
        "b-6",
        "u-vendor",
        "Sugar & Story",
        "vendor",
        "Cakes",
        "Nellore",
        "Something sweet for your story.",
        3500,
        photos.cake,
        "Small-batch celebration cakes, with custom flavors and thoughtful finishing touches.",
      ],
      [
        "b-7",
        "u-vendor",
        "Marigold Moments",
        "vendor",
        "Decoration",
        "Wanaparthy",
        "Rooted in tradition. Made for you.",
        15000,
        photos.flowers,
        "Fresh floral styling for housewarmings, engagements and family celebrations in Wanaparthy.",
      ],
      [
        "b-8",
        "u-vendor",
        "Golden Hour Collective",
        "vendor",
        "Photography",
        "Wanaparthy",
        "The moments between the moments.",
        22000,
        photos.photo,
        "Natural photographs of your favorite people, with a calm approach and an eye for the details.",
      ],
    ];
    for (const b of businesses) {
      const [
        id,
        owner,
        name,
        kind,
        category,
        city,
        tagline,
        price,
        image,
        description,
      ] = b;
      await tx.query(
        "INSERT INTO businesses(id,owner_id,name,kind,category,city,areas,description,image,status,price,tagline,verification) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
        [
          id,
          owner,
          name,
          kind,
          category,
          city,
          JSON.stringify([city]),
          description,
          image,
          "approved",
          price,
          tagline,
          "Demo profile",
        ],
      );
      await tx.query("INSERT INTO business_members VALUES($1,$2,$3)", [
        id,
        owner,
        "owner",
      ]);
    }
    const offers = [
      [
        "o-1",
        "b-1",
        "A little garden party",
        18500,
        "package",
        photos.decor,
        [
          "Floral backdrop · 8 × 8 ft",
          "Welcome sign and cake table styling",
          "Setup and next-day removal",
        ],
        ["Venue hire", "Catering", "Travel outside Hyderabad"],
      ],
      [
        "o-2",
        "b-2",
        "The celebration table",
        650,
        "guest",
        photos.food,
        [
          "Welcome drink",
          "Two starters and four mains",
          "Dessert and serving team",
        ],
        ["Venue kitchen charges", "Tables and seating"],
      ],
      [
        "o-3",
        "b-3",
        "Beautifully taken care of",
        35000,
        "planning fee",
        photos.photo,
        [
          "Planning consultation",
          "Supplier coordination",
          "Event-day planning lead",
        ],
        ["Supplier bookings", "Venue fees"],
      ],
      [
        "o-4",
        "b-4",
        "An evening at the Glasshouse",
        65000,
        "session",
        photos.venue,
        [
          "Venue for 6 hours",
          "Seating for 100 guests",
          "Basic lighting and parking",
        ],
        ["Catering", "Decor and flowers"],
      ],
      [
        "o-5",
        "b-5",
        "A birthday full of wonder",
        12500,
        "package",
        photos.party,
        ["Balloon backdrop", "Personalized name board", "Setup and collection"],
        ["Cake", "Venue"],
      ],
      [
        "o-6",
        "b-6",
        "The sweetest centerpiece",
        3500,
        "cake",
        photos.cake,
        [
          "2 kg custom buttercream cake",
          "Choice of three flavors",
          "Delivery within 5 km",
        ],
        ["Premium toppers", "Additional delivery distance"],
      ],
      [
        "o-7",
        "b-7",
        "A warm new beginning",
        15000,
        "package",
        photos.flowers,
        [
          "Entrance flower strings",
          "Pooja corner styling",
          "Setup and collection",
        ],
        ["Priest services", "Catering"],
      ],
      [
        "o-8",
        "b-8",
        "Keep this feeling",
        22000,
        "session",
        photos.photo,
        [
          "One photographer for 4 hours",
          "100 edited photographs",
          "Private download gallery",
        ],
        ["Album", "Travel beyond service area"],
      ],
    ];
    for (const o of offers)
      await tx.query(
        "INSERT INTO offerings(id,business_id,name,price,unit,image,inclusions,exclusions,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          ...o.slice(0, 6),
          JSON.stringify(o[6]),
          JSON.stringify(o[7]),
          "A thoughtfully composed starting point. Confirm your date and details for a final, itemized quote.",
        ],
      );
    const date = new Date();
    date.setDate(date.getDate() + 35);
    const eventDate = date.toISOString().slice(0, 10);
    await tx.query(
      "INSERT INTO events(id,owner_id,name,type,city,date,guests,budget,venue) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        "e-1",
        "u-customer",
        "Aarav’s first birthday",
        "Birthday",
        "Hyderabad",
        eventDate,
        80,
        85000,
        "Jubilee Hills, Hyderabad",
      ],
    );
    await tx.query("INSERT INTO event_members VALUES($1,$2,$3,$4)", [
      "e-1",
      "u-planner",
      "planner",
      0,
    ]);
    await tx.query(
      "INSERT INTO quotes(id,event_id,business_id,offering_id,status,amount,scope,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        "q-1",
        "e-1",
        "b-1",
        "o-1",
        "sent",
        18500,
        "Floral backdrop, welcome sign and cake table styling. Setup and collection included. Venue and catering excluded.",
        "Soft sage and ivory, with a little birthday magic.",
      ],
    );
    await tx.query(
      "INSERT INTO quote_versions(id,quote_id,version,amount,scope) VALUES($1,$2,1,$3,$4)",
      [
        "qv-1",
        "q-1",
        18500,
        "Floral backdrop, welcome sign and cake table styling. Setup and collection included. Venue and catering excluded.",
      ],
    );
    for (const [i, title] of [
      "Finalize the guest list",
      "Choose a cake flavor",
      "Confirm the decoration palette",
    ].entries())
      await tx.query(
        "INSERT INTO tasks(id,event_id,title,due_date) VALUES($1,$2,$3,$4)",
        [`t-${i}`, "e-1", title, eventDate],
      );
    await tx.query(
      "INSERT INTO messages(id,quote_id,sender_id,body) VALUES($1,$2,$3,$4)",
      [
        "m-1",
        "q-1",
        "u-vendor",
        "Hi Ananya! We have put together a gentle garden-inspired palette for Aarav. Your quote includes setup and collection. Happy to talk through any changes.",
      ],
    );
    await tx.query(
      "INSERT INTO notifications(id,user_id,title,body) VALUES($1,$2,$3,$4)",
      [
        "n-1",
        "u-customer",
        "Your first quote is ready",
        "The Bloom Atelier shared a proposal for Aarav’s birthday.",
      ],
    );
    await tx.query(
      "INSERT INTO businesses(id,owner_id,name,category,city,areas,description,image,price,tagline) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        "b-pending",
        "u-vendor",
        "Petal & Paper",
        "Decoration",
        "Hyderabad",
        '["Hyderabad"]',
        "Handcrafted details for intimate celebrations, from welcome signs to colorful backdrops.",
        photos.flowers,
        9500,
        "Small details. Lasting memories.",
      ],
    );
    await tx.query("INSERT INTO business_members VALUES($1,$2,$3)", [
      "b-pending",
      "u-vendor",
      "owner",
    ]);
  });
}
