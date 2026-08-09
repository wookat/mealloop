// Built-in starter recipes for brand-new households: family-friendly weeknight
// dinners, written in-house, added on request so the planner and AI drafting
// work well before the user has imported their own recipes.

export const STARTER_RECIPES = [
  {
    title: 'One-pot tomato basil pasta',
    description: 'Everything cooks in one pot — pasta, sauce and all. The weeknight classic that never gets vetoed.',
    prep: 10, cook: 20, servings: 'Serves 4', tags: 'pasta,vegetarian,one-pot',
    ingredients: ['400 g penne or rigatoni', '1 tbsp olive oil', '1 onion, finely chopped', '3 garlic cloves, sliced', '700 g passata (sieved tomatoes)', '750 ml vegetable stock', '1 tsp dried oregano', 'Large handful fresh basil', '50 g parmesan, grated', 'Salt and black pepper'],
    steps: ['Heat the oil in a large pot and soften the onion for 5 minutes; add the garlic for the last minute.', 'Add the pasta, passata, stock and oregano. Bring to a boil, then simmer for 12–14 minutes, stirring often, until the pasta is cooked and the sauce clings.', 'Season, tear in the basil, and serve with parmesan.'],
  },
  {
    title: 'Crispy chicken traybake with potatoes',
    description: 'Chicken thighs, potatoes and whatever vegetables are in the drawer — one tray, no fuss.',
    prep: 15, cook: 45, servings: 'Serves 4', tags: 'chicken,traybake',
    ingredients: ['8 chicken thighs, skin on', '800 g baby potatoes, halved', '2 red peppers, cut in chunks', '1 red onion, in wedges', '3 tbsp olive oil', '1 tsp smoked paprika', '1 lemon, halved', 'Salt and black pepper'],
    steps: ['Heat the oven to 200°C / 400°F.', 'Toss the potatoes, peppers and onion with 2 tbsp oil on a large tray. Nestle in the chicken, rub with the rest of the oil, paprika, salt and pepper.', 'Roast for 40–45 minutes until the chicken is crisp and cooked through. Squeeze the lemon over before serving.'],
  },
  {
    title: 'Weeknight beef tacos',
    description: 'Build-your-own tacos: kids assemble, parents relax. Fifteen minutes of actual cooking.',
    prep: 10, cook: 15, servings: 'Serves 4', tags: 'beef,mexican,quick',
    ingredients: ['500 g beef mince', '1 tbsp oil', '1 onion, chopped', '2 tsp ground cumin', '2 tsp mild chili powder', '400 g can chopped tomatoes', '8 small tortillas', '1 avocado, sliced', '100 g cheddar, grated', 'Lettuce, shredded', 'Soured cream, to serve'],
    steps: ['Brown the mince and onion in the oil over high heat, about 6 minutes.', 'Stir in the spices, add the tomatoes and simmer for 8 minutes until thick. Season.', 'Warm the tortillas and serve everything in bowls so everyone builds their own.'],
  },
  {
    title: 'Salmon, greens and rice bowls',
    description: 'Oven-baked salmon over rice with buttery greens — fast enough for a Tuesday, nice enough for Friday.',
    prep: 10, cook: 20, servings: 'Serves 4', tags: 'fish,healthy',
    ingredients: ['4 salmon fillets', '300 g jasmine rice', '2 tbsp soy sauce', '1 tbsp honey', '1 tsp grated ginger', '250 g green beans or broccoli', '1 tbsp butter', '1 lime, in wedges', 'Sesame seeds, to sprinkle'],
    steps: ['Cook the rice. Heat the oven to 200°C / 400°F.', 'Mix soy, honey and ginger; brush over the salmon and bake for 12–14 minutes.', 'Steam the greens and toss with butter. Serve salmon over rice with greens, lime and sesame.'],
  },
  {
    title: 'Creamy vegetable curry',
    description: 'A gentle coconut curry that eats like comfort food — swap in any vegetables you have.',
    prep: 15, cook: 25, servings: 'Serves 4', tags: 'vegetarian,curry',
    ingredients: ['1 tbsp oil', '1 onion, chopped', '2 garlic cloves, crushed', '2 tbsp mild curry paste', '400 ml can coconut milk', '400 g can chickpeas, drained', '1 sweet potato, diced', '150 g spinach', '300 g basmati rice', 'Salt', 'Naan or flatbreads, to serve'],
    steps: ['Cook the rice. Soften the onion in the oil for 5 minutes; add the garlic and curry paste for 1 minute.', 'Add the coconut milk, chickpeas and sweet potato. Simmer for 15–18 minutes until tender.', 'Stir in the spinach to wilt, season, and serve with rice and naan.'],
  },
  {
    title: 'Sheet-pan sausage and veg',
    description: 'Sausages roasted with vegetables and a mustard drizzle. The tray does the washing-up math.',
    prep: 10, cook: 35, servings: 'Serves 4', tags: 'sausage,traybake',
    ingredients: ['8 good sausages', '500 g baby potatoes, halved', '2 carrots, in batons', '1 courgette (zucchini), thickly sliced', '2 tbsp olive oil', '1 tbsp wholegrain mustard', '1 tbsp honey', 'Salt and black pepper'],
    steps: ['Heat the oven to 200°C / 400°F. Toss the vegetables with the oil on a tray, season, and roast for 10 minutes.', 'Add the sausages and roast 25 minutes more, turning once, until browned.', 'Whisk the mustard and honey with a splash of the tray juices and drizzle over.'],
  },
  {
    title: 'Homemade margherita pizzas',
    description: 'Friday-night pizzas on shop-bought dough — kids top their own halves.',
    prep: 20, cook: 12, servings: 'Makes 2 large pizzas', tags: 'pizza,vegetarian,family-favourite',
    ingredients: ['500 g pizza dough (shop-bought is fine)', '200 g passata', '1 garlic clove, crushed', '250 g mozzarella, torn', 'Handful fresh basil', '2 tbsp olive oil', 'Salt'],
    steps: ['Heat the oven as hot as it goes with a tray inside.', 'Stretch the dough into two rounds. Mix the passata with garlic, a pinch of salt and 1 tbsp oil; spread thinly.', 'Top with mozzarella and bake 10–12 minutes until blistered. Finish with basil and the rest of the oil.'],
  },
  {
    title: 'Fried rice with egg and peas',
    description: 'The best use of yesterday\u2019s rice — on the table in 15 minutes and endlessly adaptable.',
    prep: 5, cook: 10, servings: 'Serves 4', tags: 'rice,quick,leftovers',
    ingredients: ['600 g cooked, cooled rice (about 300 g uncooked)', '3 eggs, beaten', '2 tbsp oil', '150 g frozen peas', '4 spring onions, sliced', '3 tbsp soy sauce', '1 tsp sesame oil', 'Optional: leftover chicken or ham, chopped'],
    steps: ['Heat 1 tbsp oil in a wok, scramble the eggs, and set aside.', 'Add the rest of the oil, fry the rice and peas over high heat for 4–5 minutes, breaking up clumps.', 'Return the eggs with the spring onions, soy and sesame oil; toss for a minute and serve.'],
  },
];
