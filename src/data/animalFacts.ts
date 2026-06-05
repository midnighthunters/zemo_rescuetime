export type AnimalFunFact = {
  label: string;
  copy: string;
};

const fallbackFacts: AnimalFunFact[] = [
  {
    label: "Wild side",
    copy: "Every animal has special instincts, senses, and routines that help it thrive in its own world."
  },
  {
    label: "Safe friend",
    copy: "A rescued animal can rest, play, and build trust when it has steady care and a calm home."
  }
];

export const animalFunFacts: Record<string, AnimalFunFact[]> = {
  "Golden Retriever": [
    {
      label: "Gentle helper",
      copy: "Golden retrievers were bred to carry birds softly, which helped make them famously gentle with people."
    },
    {
      label: "Water fan",
      copy: "Their dense coats and webbed toes make many goldens confident swimmers."
    }
  ],
  Cat: [
    {
      label: "Quiet paws",
      copy: "Cats walk by placing back paws almost exactly where their front paws stepped, helping them move silently."
    },
    {
      label: "Built-in balance",
      copy: "A cat's tail acts like a balancing pole when it jumps, turns, or walks along narrow places."
    }
  ],
  Panda: [
    {
      label: "Bamboo specialist",
      copy: "Pandas spend much of the day eating bamboo, even though they still have a carnivore-like digestive system."
    },
    {
      label: "Extra grip",
      copy: "A panda's wrist bone works like a thumb, helping it hold bamboo stems."
    }
  ],
  Dolphin: [
    {
      label: "Sound explorer",
      copy: "Dolphins use echolocation, sending clicks through the water to learn what is nearby."
    },
    {
      label: "Signature calls",
      copy: "Many dolphins have unique whistles that work a bit like names in their social groups."
    }
  ],
  Rabbit: [
    {
      label: "Panoramic view",
      copy: "Rabbit eyes sit high and wide, giving them a nearly all-around view for spotting danger."
    },
    {
      label: "Happy hop",
      copy: "When rabbits feel playful, they may leap and twist in the air in a move often called a binky."
    }
  ],
  Penguin: [
    {
      label: "Ocean flyer",
      copy: "Penguin wings are shaped like flippers, so they fly through water instead of air."
    },
    {
      label: "Cozy crowd",
      copy: "Some penguins huddle together to share warmth and rotate positions so everyone gets a turn inside."
    }
  ],
  "Shiba Inu": [
    {
      label: "Ancient roots",
      copy: "Shiba inu are one of Japan's old native dog breeds and were once used for hunting in mountain terrain."
    },
    {
      label: "Clean routine",
      copy: "Shibas are known for grooming themselves carefully and often dislike getting messy."
    }
  ],
  "Red Panda": [
    {
      label: "Tree napper",
      copy: "Red pandas spend lots of time in trees, using their long tails for balance and warmth."
    },
    {
      label: "Bamboo snack",
      copy: "Like giant pandas, red pandas eat bamboo, but they also nibble fruit, eggs, and small insects."
    }
  ],
  Koala: [
    {
      label: "Leaf menu",
      copy: "Koalas mostly eat eucalyptus leaves and have a special gut that helps break down the tough food."
    },
    {
      label: "Sleepy schedule",
      copy: "Because eucalyptus is low in energy, koalas rest for long stretches to conserve fuel."
    }
  ],
  Clownfish: [
    {
      label: "Anemone neighbor",
      copy: "Clownfish live among sea anemone tentacles, gaining protection while helping clean and defend the anemone."
    },
    {
      label: "Home map",
      copy: "Young clownfish can use sound and scent cues to find reef habitats."
    }
  ],
  Elephant: [
    {
      label: "Trunk toolkit",
      copy: "An elephant's trunk can breathe, smell, drink, lift, touch, and gently pick up small objects."
    },
    {
      label: "Low rumbles",
      copy: "Elephants communicate with deep calls that can travel surprisingly far through ground and air."
    }
  ],
  Pomeranian: [
    {
      label: "Tiny spitz",
      copy: "Pomeranians descend from larger spitz sled and herding dogs from cold northern regions."
    },
    {
      label: "Big coat",
      copy: "Their fluffy double coat has a soft undercoat and longer guard hairs that create the puffball look."
    }
  ],
  Otter: [
    {
      label: "Tool user",
      copy: "Sea otters are famous for using rocks to crack open shellfish."
    },
    {
      label: "Pocket paws",
      copy: "Loose skin under a sea otter's forearms can hold food or a favorite rock while it floats."
    }
  ],
  Parrot: [
    {
      label: "Smart beak",
      copy: "Parrots use their strong curved beaks like tools for climbing, cracking food, and exploring."
    },
    {
      label: "Sound mimic",
      copy: "Many parrots can copy sounds because they are social birds with flexible vocal learning."
    }
  ],
  "Sea Turtle": [
    {
      label: "Long journey",
      copy: "Many sea turtles migrate huge distances between feeding areas and nesting beaches."
    },
    {
      label: "Beach memory",
      copy: "Female sea turtles often return near the beach where they hatched to lay eggs."
    }
  ],
  Husky: [
    {
      label: "Snow runner",
      copy: "Huskies were developed to pull sleds across cold landscapes with steady endurance."
    },
    {
      label: "Warm gear",
      copy: "Their thick double coat helps insulate them from freezing weather."
    }
  ],
  Hamster: [
    {
      label: "Cheek storage",
      copy: "Hamsters have stretchy cheek pouches that let them carry food back to a safe stash."
    },
    {
      label: "Night mover",
      copy: "Many hamsters are most active after dusk, when they forage and explore."
    }
  ],
  Seahorse: [
    {
      label: "Dad carries eggs",
      copy: "Male seahorses carry developing eggs in a pouch until the babies are ready to emerge."
    },
    {
      label: "Tiny anchor",
      copy: "A seahorse can curl its tail around seagrass or coral to stay in place."
    }
  ],
  Fox: [
    {
      label: "Magnetic hunter",
      copy: "Red foxes may use Earth's magnetic field as a guide when pouncing on hidden prey."
    },
    {
      label: "Many voices",
      copy: "Foxes communicate with barks, screams, chirps, and body language."
    }
  ],
  Owl: [
    {
      label: "Silent wings",
      copy: "Many owls have soft-edged feathers that reduce flight noise while hunting."
    },
    {
      label: "Head turn",
      copy: "Owls cannot move their eyes much, so flexible necks help them look around."
    }
  ],
  Giraffe: [
    {
      label: "Tall heart",
      copy: "Giraffes need a powerful heart to pump blood all the way up their long necks."
    },
    {
      label: "Pattern ID",
      copy: "Each giraffe has a unique coat pattern, much like a fingerprint."
    }
  ],
  Goldfish: [
    {
      label: "Color vision",
      copy: "Goldfish can see colors and can learn to recognize routines, shapes, and feeding cues."
    },
    {
      label: "No eyelids",
      copy: "Goldfish do not have eyelids, so they rest with their eyes open."
    }
  ],
  Seal: [
    {
      label: "Whisker radar",
      copy: "Seal whiskers can detect tiny water movements left behind by swimming fish."
    },
    {
      label: "Deep rest",
      copy: "Some seals can slow their heart rate while diving to conserve oxygen."
    }
  ],
  Flamingo: [
    {
      label: "Pink plate",
      copy: "Flamingos get their pink color from pigments in the algae and tiny animals they eat."
    },
    {
      label: "Upside-down filter",
      copy: "A flamingo feeds with its head upside down, filtering food from shallow water."
    }
  ],
  Squirrel: [
    {
      label: "Memory map",
      copy: "Squirrels bury food in many places and use memory plus scent to find caches later."
    },
    {
      label: "Tail signals",
      copy: "A squirrel's tail helps with balance, warmth, shade, and warning displays."
    }
  ],
  Hedgehog: [
    {
      label: "Spiky shield",
      copy: "When threatened, a hedgehog can curl into a tight ball with spines facing outward."
    },
    {
      label: "Sniff explorer",
      copy: "Hedgehogs rely heavily on smell and hearing while exploring at night."
    }
  ],
  Tiger: [
    {
      label: "Striped skin",
      copy: "A tiger's stripes are unique, and the pattern is visible on the skin beneath the fur."
    },
    {
      label: "Water cat",
      copy: "Unlike many cats, tigers are strong swimmers and often cool off in water."
    }
  ],
  Toucan: [
    {
      label: "Light beak",
      copy: "A toucan's huge beak is surprisingly light because it has a honeycomb-like structure."
    },
    {
      label: "Fruit tosser",
      copy: "Toucans often toss fruit into the air and catch it before swallowing."
    }
  ],
  Alpaca: [
    {
      label: "Soft fleece",
      copy: "Alpaca fleece is warm, lightweight, and naturally soft because the fibers are fine."
    },
    {
      label: "Group comfort",
      copy: "Alpacas are herd animals and feel safest with companions nearby."
    }
  ],
  Monkey: [
    {
      label: "Social learner",
      copy: "Many monkeys learn food choices, grooming habits, and warning calls by watching their group."
    },
    {
      label: "Flexible hands",
      copy: "Monkey hands help them grip branches, pick food, and explore objects."
    }
  ],
  Deer: [
    {
      label: "Antler reset",
      copy: "Most male deer grow and shed a new set of antlers every year."
    },
    {
      label: "Sharp senses",
      copy: "Deer rely on excellent hearing and smell to notice danger early."
    }
  ],
  Swan: [
    {
      label: "Strong pair bonds",
      copy: "Many swans form long-lasting pairs and cooperate to defend nesting areas."
    },
    {
      label: "Graceful power",
      copy: "Swans look elegant, but their wings are strong and useful for quick water takeoffs."
    }
  ],
  Horse: [
    {
      label: "Side vision",
      copy: "Horses have wide-set eyes that give them a broad field of view."
    },
    {
      label: "Mood ears",
      copy: "A horse's ears can point toward sounds and often reveal where its attention is focused."
    }
  ],
  Lion: [
    {
      label: "Pride life",
      copy: "Lions are unusually social cats, often living in groups called prides."
    },
    {
      label: "Roaring range",
      copy: "A lion's roar can carry across long distances to signal territory and location."
    }
  ],
  Pig: [
    {
      label: "Super snout",
      copy: "Pigs have an excellent sense of smell and use their snouts to root through soil."
    },
    {
      label: "Smart friend",
      copy: "Pigs are quick learners and can solve simple puzzles for food rewards."
    }
  ],
  Peacock: [
    {
      label: "Train display",
      copy: "A peacock's famous fan is made of long upper tail coverts, not the tail feathers themselves."
    },
    {
      label: "Eye spots",
      copy: "The shimmering eye spots on the train help make courtship displays more noticeable."
    }
  ],
  "Blue Tang": [
    {
      label: "Color shift",
      copy: "Young blue tangs are bright yellow before they grow into their blue adult colors."
    },
    {
      label: "Reef grazer",
      copy: "Blue tangs nibble algae, helping keep reef surfaces clear for corals."
    }
  ],
  Kangaroo: [
    {
      label: "Spring legs",
      copy: "Kangaroos use elastic tendons in their legs to hop efficiently over long distances."
    },
    {
      label: "Pouch nursery",
      copy: "A baby kangaroo, called a joey, grows safely inside its mother's pouch."
    }
  ],
  Sloth: [
    {
      label: "Slow energy",
      copy: "Sloths move slowly because their leafy diet gives them limited energy."
    },
    {
      label: "Tree life",
      copy: "Their curved claws help them hang from branches with very little effort."
    }
  ],
  Raccoon: [
    {
      label: "Sensitive paws",
      copy: "A raccoon's front paws are packed with touch sensors that help it inspect food and objects."
    },
    {
      label: "Night problem-solver",
      copy: "Raccoons are adaptable foragers and can remember solutions to simple challenges."
    }
  ],
  Cow: [
    {
      label: "Four-part stomach",
      copy: "Cows digest grass with a four-compartment stomach and helpful microbes."
    },
    {
      label: "Best buddies",
      copy: "Cows can form social bonds and often prefer spending time near familiar companions."
    }
  ],
  "Polar Bear": [
    {
      label: "Black skin",
      copy: "Polar bears have black skin under their pale fur, which helps absorb warmth from sunlight."
    },
    {
      label: "Sea bear",
      copy: "Polar bears are strong swimmers and are considered marine mammals because they depend on sea ice."
    }
  ],
  Wolf: [
    {
      label: "Pack teamwork",
      copy: "Wolves live in family packs where members cooperate to raise pups and find food."
    },
    {
      label: "Long-distance call",
      copy: "Howling helps wolves keep contact with pack members across large territories."
    }
  ],
  Macaw: [
    {
      label: "Power beak",
      copy: "Macaws can crack tough nuts and seeds with their strong curved beaks."
    },
    {
      label: "Bright signal",
      copy: "Their vivid feathers help with recognition and display in dense tropical forests."
    }
  ],
  Zebra: [
    {
      label: "Stripe identity",
      copy: "Every zebra has a unique stripe pattern that can help individuals recognize each other."
    },
    {
      label: "Moving herd",
      copy: "Zebras often travel in groups, where many eyes help watch for predators."
    }
  ],
  Donkey: [
    {
      label: "Careful thinker",
      copy: "Donkeys often pause to assess danger, which can look stubborn but is really caution."
    },
    {
      label: "Big ears",
      copy: "Large ears help donkeys hear distant sounds and release heat in warm climates."
    }
  ],
  Platypus: [
    {
      label: "Egg-laying mammal",
      copy: "Platypuses are mammals, but females lay eggs instead of giving birth to live young."
    },
    {
      label: "Electric sense",
      copy: "A platypus can detect tiny electric signals from prey using sensors in its bill."
    }
  ],
  Cheetah: [
    {
      label: "Sprint body",
      copy: "Cheetahs have flexible spines, long legs, and large nasal passages built for short bursts of speed."
    },
    {
      label: "Tear marks",
      copy: "Dark facial lines may help reduce glare and focus attention while hunting."
    }
  ],
  "Snow Leopard": [
    {
      label: "Mountain jumper",
      copy: "Snow leopards use powerful hind legs and long tails to leap across rocky slopes."
    },
    {
      label: "Warm tail",
      copy: "Their thick tails help with balance and can wrap around the face like a scarf."
    }
  ],
  Orangutan: [
    {
      label: "Forest thinker",
      copy: "Orangutans are skilled problem-solvers and may use sticks or leaves as tools."
    },
    {
      label: "Tree builder",
      copy: "They make fresh sleeping nests from branches and leaves high in the trees."
    }
  ],
  Armadillo: [
    {
      label: "Armor plates",
      copy: "Armadillos wear flexible bony plates covered by tough skin for protection."
    },
    {
      label: "Digging expert",
      copy: "Strong claws help armadillos dig burrows and search for insects."
    }
  ],
  Gorilla: [
    {
      label: "Gentle strength",
      copy: "Gorillas are powerful primates, but their groups spend much of the day eating plants and resting."
    },
    {
      label: "Knuckle walk",
      copy: "Gorillas usually move on all fours by supporting weight on their knuckles."
    }
  ],
  Eagle: [
    {
      label: "Sharp sight",
      copy: "Eagles have excellent vision that helps them spot prey from high above."
    },
    {
      label: "Soaring skill",
      copy: "Broad wings let many eagles ride rising air currents while saving energy."
    }
  ],
  Starfish: [
    {
      label: "Sea star",
      copy: "Starfish are also called sea stars because they are not fish."
    },
    {
      label: "Tube feet",
      copy: "Tiny tube feet help sea stars move, grip surfaces, and handle food."
    }
  ],
  "Beluga Whale": [
    {
      label: "Melon head",
      copy: "A beluga's rounded forehead, called a melon, helps focus sounds for echolocation."
    },
    {
      label: "Chatty whale",
      copy: "Belugas make many whistles, clicks, and chirps, earning them the nickname sea canaries."
    }
  ],
  "White Tiger": [
    {
      label: "Color variation",
      copy: "White tigers are not a separate species; their pale coat comes from a rare genetic variation."
    },
    {
      label: "Striped individual",
      copy: "Like orange tigers, each white tiger has its own unique stripe pattern."
    }
  ],
  Camel: [
    {
      label: "Hump fuel",
      copy: "A camel's hump stores fat, which can be used for energy when food is scarce."
    },
    {
      label: "Desert eyes",
      copy: "Long lashes and closable nostrils help camels handle blowing sand."
    }
  ],
  Rhino: [
    {
      label: "Keratin horn",
      copy: "A rhino horn is made mostly of keratin, the same tough protein found in hair and nails."
    },
    {
      label: "Scent messages",
      copy: "Rhinos use scent marks and dung piles to communicate with other rhinos."
    }
  ],
  Hippo: [
    {
      label: "River rest",
      copy: "Hippos spend much of the day in water to keep cool and protect their skin."
    },
    {
      label: "Sun screen",
      copy: "Hippos secrete a reddish oily fluid that helps protect their skin."
    }
  ],
  Ostrich: [
    {
      label: "Fast runner",
      copy: "Ostriches cannot fly, but their long legs make them powerful runners."
    },
    {
      label: "Giant eggs",
      copy: "Ostriches lay the largest eggs of any living bird."
    }
  ],
  "Mandarin Duck": [
    {
      label: "Color show",
      copy: "Male mandarin ducks grow vivid breeding plumage with sail-like orange feathers."
    },
    {
      label: "Tree nest",
      copy: "Mandarin ducks often nest in tree cavities near water."
    }
  ],
  "Glasswing Butterfly": [
    {
      label: "Clear wings",
      copy: "Glasswing butterflies have transparent wing sections that make them harder to spot."
    },
    {
      label: "Tiny scales",
      copy: "Their clear look comes from wing areas with very sparse scales and special surface structures."
    }
  ],
  "Leafy Sea Dragon": [
    {
      label: "Living seaweed",
      copy: "Leafy sea dragons use leaf-like body parts as camouflage among sea plants."
    },
    {
      label: "Dad duty",
      copy: "Males carry fertilized eggs on a brood patch until they hatch."
    }
  ],
  Orca: [
    {
      label: "Family dialects",
      copy: "Orca groups can have distinct call patterns that are passed through families."
    },
    {
      label: "Ocean teamwork",
      copy: "Orcas are highly social hunters and often coordinate as a pod."
    }
  ],
  Axolotl: [
    {
      label: "Regrowth star",
      copy: "Axolotls can regrow limbs and even parts of organs without heavy scarring."
    },
    {
      label: "Forever young",
      copy: "They keep many larval features as adults, including feathery external gills."
    }
  ],
  "Sunda Pangolin": [
    {
      label: "Keratin scales",
      copy: "Pangolin scales are made of keratin, the same protein found in human fingernails."
    },
    {
      label: "Ant specialist",
      copy: "A long sticky tongue helps pangolins collect ants and termites."
    }
  ],
  Frog: [
    {
      label: "Skin drink",
      copy: "Many frogs absorb water through their skin instead of drinking with their mouths."
    },
    {
      label: "Big leap",
      copy: "Strong back legs help frogs jump quickly away from danger."
    }
  ],
  "Black Panther": [
    {
      label: "Shadow coat",
      copy: "Black panthers are usually melanistic leopards or jaguars with extra dark pigment."
    },
    {
      label: "Hidden spots",
      copy: "Their rosette markings can still show through the dark fur in bright light."
    }
  ],
  Octopus: [
    {
      label: "Eight thinkers",
      copy: "An octopus has a large nervous system, with many neurons spread through its arms."
    },
    {
      label: "Color artist",
      copy: "Special skin cells let octopuses change color and texture for camouflage or display."
    }
  ],
  Buffalo: [
    {
      label: "Herd strength",
      copy: "Buffalo rely on group awareness and strong social bonds for protection."
    },
    {
      label: "Mud comfort",
      copy: "Many buffalo wallow in mud to cool down and keep biting insects away."
    }
  ],
  "Komodo Dragon": [
    {
      label: "Giant lizard",
      copy: "Komodo dragons are the largest living lizards."
    },
    {
      label: "Scent tracker",
      copy: "They use a forked tongue to sample scent particles and track food."
    }
  ],
  Crocodile: [
    {
      label: "Ancient design",
      copy: "Crocodiles belong to an old reptile lineage with body plans built for ambush hunting."
    },
    {
      label: "Careful parent",
      copy: "Female crocodiles guard nests and may carry hatchlings gently in their mouths."
    }
  ],
  Reindeer: [
    {
      label: "Snow travel",
      copy: "Reindeer hooves spread wide to help them walk on snow and soft ground."
    },
    {
      label: "Antler surprise",
      copy: "Reindeer are the only deer species where females regularly grow antlers too."
    }
  ],
  "Brown Bear": [
    {
      label: "Winter rest",
      copy: "Brown bears can spend winter in a den, lowering activity while living off stored fat."
    },
    {
      label: "Power nose",
      copy: "Their sense of smell is extremely strong and helps them find food over long distances."
    }
  ],
  Crab: [
    {
      label: "Side step",
      copy: "Many crabs move sideways because their leg joints are built for that direction."
    },
    {
      label: "Shell swap",
      copy: "As crabs grow, they molt their hard outer shell and form a bigger one."
    }
  ],
  Baboon: [
    {
      label: "Troop life",
      copy: "Baboons live in social groups where grooming helps build bonds and reduce tension."
    },
    {
      label: "Adaptable menu",
      copy: "Baboons eat many foods, from fruit and seeds to insects and small animals."
    }
  ],
  Shark: [
    {
      label: "Cartilage frame",
      copy: "Shark skeletons are made of cartilage instead of bone, making them lighter and flexible."
    },
    {
      label: "Electric sense",
      copy: "Many sharks can sense tiny electric fields produced by other animals."
    }
  ],
  Ladybug: [
    {
      label: "Garden helper",
      copy: "Many ladybugs eat aphids, which makes them helpful visitors in gardens."
    },
    {
      label: "Warning colors",
      copy: "Bright red and orange shells warn predators that ladybugs may taste unpleasant."
    }
  ],
  Mantis: [
    {
      label: "Fast grab",
      copy: "A mantis uses spiny front legs to snatch prey with quick, precise movements."
    },
    {
      label: "Head turn",
      copy: "Mantises can rotate their heads widely, helping them track movement around them."
    }
  ]
};

export function getAnimalFunFacts(animalName: string) {
  return animalFunFacts[animalName] ?? fallbackFacts;
}
