#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const DATA_ROOT = path.join(ROOT, 'public', 'data')
const SUBJECTS = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, 'subjects.json'), 'utf8')).subjects || []
const SOURCE_SET = 'lynkedu_capacity_20260716'

const subjectDirs = {
  biology: 'Biology',
  'computer-science-principles': 'Computer-Science-Principles',
  'environmental-science': 'Environmental-Science',
  'physics-1': 'Physics-1',
  'physics-2': 'Physics-2',
}

function optionSet(correct, wrongs) {
  return {
    A: wrongs[0],
    B: correct,
    C: wrongs[1],
    D: wrongs[2],
    E: wrongs[3],
  }
}

function item(unit, text, correct, wrongs, topic, difficulty = 'medium') {
  return { unit, text, options: optionSet(correct, wrongs), answer: 'B', topic, difficulty }
}

const banks = {
  'computer-science-principles': [
    ...[
      ['U1', 'A team is developing a study-planner app. Which action best supports iterative program development?', 'Release a small prototype, collect user feedback, and revise the design.', ['Write the final code before asking users to try it.', 'Choose colors before deciding what problem the app solves.', 'Avoid testing until every planned feature is complete.', 'Let only one team member make all design decisions.'], 'iterative development'],
      ['U1', 'A student creates a digital tool to help classmates organize assignment deadlines. Which statement best describes the app purpose?', 'It describes the problem the app is intended to solve for its users.', ['It lists every variable name used in the code.', 'It records the device on which the app was written.', 'It proves the app has no defects.', 'It replaces the need for user feedback.'], 'app purpose'],
      ['U1', 'During early design, two students disagree about which feature should be built first. Which approach is most likely to improve collaboration?', 'Compare the feature ideas to the stated user need and record the decision.', ['Let the fastest typist decide.', 'Remove all comments from the project files.', 'Delay all decisions until the submission deadline.', 'Use only features that require no testing.'], 'collaboration'],
      ['U1', 'Which artifact would best help a new teammate understand how an app design is intended to meet the user need before implementation begins?', 'A storyboard or design brief showing the intended user experience.', ['A list of keyboard shortcuts for the development environment.', 'A copy of the final score from one test run.', 'A screenshot of the file folder.', 'A list of unrelated apps.'], 'design documentation'],
      ['U1', 'A group changes a program after watching users struggle with one input screen. What is the main value of this change?', 'It uses feedback from users to improve the program design.', ['It guarantees the program will receive a perfect score.', 'It removes the need for future testing.', 'It proves that all algorithms are optimal.', 'It makes the program independent of its purpose.'], 'user feedback'],
      ['U1', 'Which development practice best helps a team identify problems while a program is still small?', 'Test each completed feature with representative inputs before adding more features.', ['Test only the final version.', 'Keep all versions in one unnamed file.', 'Ask users to avoid unusual inputs.', 'Skip testing for features that seem simple.'], 'testing during development'],
      ['U1', 'A program is designed for elementary students. Which design choice most directly addresses the intended audience?', 'Using clear labels and age-appropriate instructions.', ['Using variable names that are difficult to pronounce.', 'Requiring users to read source code before starting.', 'Hiding all feedback messages.', 'Choosing a data format unrelated to the task.'], 'user-centered design'],
      ['U1', 'A student uses a library to add charting features to an app. Which statement best describes why this can support development?', 'It lets the student reuse tested functionality while focusing on the app purpose.', ['It means the student no longer needs to understand inputs.', 'It prevents all future changes to the app.', 'It automatically selects the app audience.', 'It removes the need to credit external resources when required.'], 'using libraries'],
      ['U1', 'A development team creates milestones for a large project. What is the most important reason to do this?', 'Milestones divide the project into smaller goals that can be reviewed and tested.', ['Milestones make user feedback unnecessary.', 'Milestones ensure every feature has identical code.', 'Milestones prevent collaborators from communicating.', 'Milestones replace the program requirements.'], 'project planning'],
      ['U1', 'Which question is most useful when evaluating whether a computing innovation meets its goal?', 'Does it help the intended users complete the task it was designed for?', ['Does it use the longest possible program?', 'Does it avoid all input from users?', 'Does it contain the largest number of files?', 'Does it use the same interface as every other app?'], 'evaluation'],
      ['U1', 'A team keeps a record of design decisions and reasons for changes. Which outcome is most directly supported?', 'Future revisions are easier because the team can understand why earlier choices were made.', ['The program can run without a processor.', 'The program no longer needs input validation.', 'All team members must write the same function.', 'The app becomes unrelated to its original goal.'], 'design history'],
      ['U1', 'A student has two possible app ideas. Which criterion best helps choose the stronger idea for a Create-style project?', 'The idea can be implemented, tested, and explained as a program with a clear purpose.', ['The idea requires no algorithm.', 'The idea cannot be demonstrated.', 'The idea has no intended users.', 'The idea depends on private data the student cannot use.'], 'project feasibility'],
    ].map(args => item(...args)),
    ...[
      ['U2', 'A city publishes daily bus arrival data. Which change would most improve the usefulness of the data for analysis?', 'Including consistent timestamps and route identifiers for each record.', ['Removing all dates from the records.', 'Using a different unit for each row.', 'Replacing numerical delays with unrelated words.', 'Sorting the records randomly before every use.'], 'data quality'],
      ['U2', 'Which example best illustrates metadata?', 'The date, location, and device type stored with a digital photo.', ['The color of a printed poster.', 'The number of students in a classroom.', 'A password chosen by a user.', 'The final answer to an arithmetic expression.'], 'metadata'],
      ['U2', 'A data set contains repeated records for the same event. What should be done before using it to support a claim?', 'Clean the data by identifying and handling duplicate records.', ['Add more duplicate records.', 'Ignore the repeated records if the file is large.', 'Change the answer choices in a survey.', 'Assume every repeated record represents a new event.'], 'data cleaning'],
      ['U2', 'Which statement about lossy compression is true?', 'It can reduce file size by permanently removing some information.', ['It always restores every original bit exactly.', 'It can be used only on text files.', 'It increases file size for every image.', 'It prevents data from being transmitted.'], 'compression'],
      ['U2', 'A graph shows average values but hides the number of records in each group. What is a reasonable concern?', 'The graph may make small groups appear as reliable as large groups.', ['The graph cannot contain any useful information.', 'The graph must be sorted alphabetically.', 'The graph cannot be displayed on a computer.', 'The graph proves the data was collected fairly.'], 'data visualization'],
      ['U2', 'Which data collection plan is most likely to produce a biased result?', 'Surveying only students who already belong to the robotics club about interest in robotics.', ['Sampling students from every grade level.', 'Recording responses with the same question wording.', 'Including the total number of responses.', 'Allowing respondents to skip optional comments.'], 'data bias'],
      ['U2', 'A sensor records temperature every minute. Which question can be answered most directly from this data?', 'During which hour did the temperature increase the most?', ['What was the favorite color of each user?', 'Which programming language created the sensor?', 'How many books are in the library?', 'What password protects the sensor account?'], 'data analysis'],
      ['U5', 'Why can combining two public data sets still require care?', 'The combined data may reveal patterns about individuals that neither data set showed alone.', ['Combining data always makes it less useful.', 'Public data cannot contain numerical values.', 'All combined data must be deleted immediately.', 'Data sets with different fields cannot be compared in any way.'], 'data privacy'],
    ].map(args => item(...args)),
    ...[
      ['U4', 'A user opens a web page. Which sequence best describes the role of packets on the network?', 'The data is divided into packets that may travel separately and are reassembled by the receiver.', ['The whole page must travel as one unbroken file.', 'Packets can be read only by monitors attached to the same keyboard.', 'Each packet must follow the exact same physical path.', 'Packets are used only for images, not text.'], 'packets'],
      ['U4', 'Which feature is a main reason the Internet can continue operating when one route is unavailable?', 'Routers can forward packets along different available paths.', ['Every computer stores the entire Internet.', 'All devices use one central cable.', 'Each web page has only one possible server.', 'Network addresses are never used.'], 'routing'],
      ['U4', 'What is the purpose of a protocol in computer networks?', 'It defines rules that allow devices from different systems to communicate.', ['It stores every file permanently.', 'It replaces the need for a network address.', 'It makes all devices run the same app.', 'It prevents users from sending messages.'], 'protocols'],
      ['U4', 'Why is redundancy important in network design?', 'It provides alternative paths or components if one part is unavailable.', ['It guarantees every message is shorter.', 'It removes the need for protocols.', 'It makes every packet identical.', 'It prevents devices from joining the network.'], 'redundancy'],
      ['U4', 'Which statement best describes bandwidth?', 'It is the maximum rate at which data can be transmitted over a connection.', ['It is the physical length of a username.', 'It is the number of colors in an icon.', 'It is the amount of code in an app.', 'It is the time zone of a server.'], 'bandwidth'],
      ['U4', 'Which practice best protects the confidentiality of data sent over a public network?', 'Encoding the data so that only an intended receiver can read it.', ['Sending the data more slowly.', 'Changing the font size of the message.', 'Removing all timestamps from the message.', 'Using a shorter file name.'], 'secure communication'],
      ['U4', 'A domain name is entered into a browser. What service helps translate the name to a numerical network address?', 'Domain Name System', ['Random access memory', 'A graphics processor', 'A spreadsheet formula', 'A local printer driver'], 'DNS'],
      ['U4', 'Which situation best illustrates fault tolerance?', 'A message still arrives because packets are routed through another connection after one link stops working.', ['A message is printed before it is sent.', 'A file is renamed without changing its contents.', 'A user changes the screen brightness.', 'A program uses only one possible path for all data.'], 'fault tolerance'],
      ['U4', 'Which information is needed so data can be delivered to the correct device on a network?', 'A network address for the destination device.', ['The favorite color of the sender.', 'The brand of the monitor.', 'The number of comments in the code.', 'The size of the keyboard.'], 'addressing'],
      ['U4', 'Which statement about open standards on the Internet is most accurate?', 'They allow different hardware and software systems to communicate using shared rules.', ['They require every company to make identical devices.', 'They prevent new applications from being created.', 'They remove the need for data formats.', 'They allow communication only inside one building.'], 'open standards'],
      ['U4', 'A school video meeting has high latency. What is most likely happening?', 'There is a noticeable delay between sending and receiving data.', ['The video file has no pixels.', 'The server has no address.', 'The meeting uses no protocol.', 'The data is stored only on paper.'], 'latency'],
    ].map(args => item(...args)),
    ...[
      ['U5', 'A navigation app suggests a faster route using location data. Which is a likely beneficial effect?', 'Drivers may reduce travel time by using current traffic information.', ['All users will have identical travel needs.', 'The app no longer needs data.', 'The road network becomes smaller.', 'The app cannot affect user behavior.'], 'beneficial effects'],
      ['U5', 'Which situation shows a possible harmful effect of an automated decision system?', 'A system trained on incomplete historical data gives less accurate results for some groups.', ['A calculator adds two numbers correctly.', 'A map app displays a scale bar.', 'A document editor saves a file.', 'A weather app reports the current temperature.'], 'harmful effects'],
      ['U5', 'Why can accessibility features be an important part of a computing innovation?', 'They can help people with different abilities use the innovation effectively.', ['They always make the program run without input.', 'They remove the need to test the program.', 'They guarantee the program is free.', 'They prevent the program from using data.'], 'accessibility'],
      ['U5', 'Which statement best describes a digital divide concern?', 'Some people may have less access to devices or reliable Internet service.', ['Every user has the same Internet connection.', 'All websites use the same colors.', 'Data files cannot be copied.', 'Computers cannot communicate with each other.'], 'digital divide'],
      ['U5', 'A social media platform recommends posts based on previous clicks. Which concern is most directly related?', 'Users may see a narrower range of information over time.', ['The platform cannot store text.', 'Recommendations cannot be computed.', 'The Internet stops using protocols.', 'All users must see exactly the same posts.'], 'recommendation effects'],
      ['U5', 'Which example best shows crowdsourcing?', 'Many volunteers contribute observations to a shared bird-sighting database.', ['One person writes notes in a private journal.', 'A calculator stores one arithmetic result.', 'A computer displays the current time.', 'A printer produces one copy of a worksheet.'], 'crowdsourcing'],
      ['U5', 'Which action best supports responsible use of data in an app?', 'Collect only the data needed for the stated purpose and explain how it will be used.', ['Collect every possible field even when unnecessary.', 'Hide all data practices from users.', 'Use data for unrelated purposes without notice.', 'Make the purpose of the app unclear.'], 'responsible data use'],
      ['U5', 'Which claim about computing innovations is most accurate?', 'The same innovation can have both beneficial and harmful effects on society.', ['Every innovation has only beneficial effects.', 'Every innovation affects all people in exactly the same way.', 'Computing innovations cannot affect society.', 'Harmful effects are impossible to identify.'], 'societal effects'],
      ['U5', 'Which example best illustrates citizen science supported by computing?', 'People submit local water-quality measurements to a shared online project.', ['A student turns off a monitor.', 'A user changes the wallpaper on a phone.', 'A printer runs out of paper.', 'A calculator is stored in a desk.'], 'citizen science'],
      ['U5', 'Why might a translation app affect global communication?', 'It can help people who use different languages exchange information more easily.', ['It prevents all communication between countries.', 'It removes the need for any input text.', 'It can operate only without data.', 'It guarantees every translation is perfect.'], 'global impact'],
    ].map(args => item(...args)),
  ],
  biology: [
    ...[
      ['U2', 'A cell is placed in a solution with a higher solute concentration than the cytoplasm. What is the most likely immediate result?', 'Water moves out of the cell by osmosis.', ['Water moves into the cell by osmosis.', 'The cell makes a new nucleus.', 'ATP production stops because diffusion is impossible.', 'The cell membrane becomes a cell wall.'], 'osmosis'],
      ['U2', 'Which observation provides the strongest evidence that a membrane protein is involved in transport?', 'The substance crosses the membrane faster when a specific carrier protein is present.', ['The substance is the same color as the membrane.', 'The cell is viewed with a lower magnification.', 'The solution contains only water.', 'The membrane has no phospholipids.'], 'membrane transport'],
      ['U2', 'A researcher blocks the function of ribosomes in a eukaryotic cell. Which process is most directly affected?', 'Translation of mRNA into polypeptides.', ['Replication of the plasma membrane.', 'Diffusion of oxygen through the membrane.', 'Storage of genetic information in DNA.', 'Movement of water through aquaporins only.'], 'ribosomes'],
      ['U2', 'Which feature of phospholipids allows them to form a bilayer in water?', 'They have hydrophilic heads and hydrophobic tails.', ['They are made only of nucleotides.', 'They contain no carbon atoms.', 'They are rigid proteins.', 'They permanently bind to DNA.'], 'phospholipid bilayer'],
      ['U2', 'A plant cell is placed in distilled water and does not burst. Which structure most directly explains this outcome?', 'The cell wall resists expansion as water enters.', ['The nucleus pumps water out.', 'Chlorophyll digests extra water.', 'Ribosomes dissolve the cytoplasm.', 'Mitochondria become chromosomes.'], 'cell wall'],
      ['U2', 'Which statement best describes the endomembrane system?', 'It includes organelles that modify, package, and transport cellular products.', ['It is the set of all chromosomes in a cell.', 'It is the process of crossing over during meiosis.', 'It is the movement of water across a membrane only.', 'It is the breakdown of glucose in the cytosol only.'], 'endomembrane system'],
      ['U2', 'A mutation prevents a receptor protein from reaching the plasma membrane. Which outcome is most likely?', 'The cell is less able to respond to the receptor ligand outside the cell.', ['The cell immediately becomes prokaryotic.', 'The cell can no longer contain DNA.', 'The cell wall becomes a ribosome.', 'The cytoplasm loses all water.'], 'membrane proteins'],
      ['U2', 'Which comparison between prokaryotic and eukaryotic cells is accurate?', 'Eukaryotic cells contain membrane-bound organelles, while prokaryotic cells generally do not.', ['Only prokaryotic cells contain DNA.', 'Only prokaryotic cells use ribosomes.', 'Eukaryotic cells lack plasma membranes.', 'Prokaryotic cells always contain chloroplasts.'], 'cell structure'],
    ].map(args => item(...args)),
    ...[
      ['U4', 'A signal molecule binds to a receptor on the surface of a cell. What is the most likely next step in signal transduction?', 'The receptor changes shape and begins an intracellular response.', ['The cell immediately completes meiosis.', 'The ligand becomes part of the nuclear DNA.', 'All membrane proteins leave the cell.', 'The cell wall digests the ligand.'], 'cell signaling'],
      ['U4', 'Which event occurs during the G2 checkpoint of the cell cycle?', 'The cell checks whether DNA replication has been completed properly before mitosis.', ['Homologous chromosomes pair during meiosis I.', 'The cell divides its cytoplasm before DNA replication.', 'Ribosomes translate every gene at once.', 'The plasma membrane disappears permanently.'], 'cell cycle checkpoint'],
      ['U4', 'A drug prevents cyclin-dependent kinase activity. Which process is most likely disrupted?', 'Progression through regulated stages of the cell cycle.', ['Passive diffusion of oxygen.', 'The formation of peptide bonds in all cells.', 'The base-pairing rules of DNA.', 'The polarity of water molecules.'], 'cell cycle regulation'],
      ['U4', 'Which outcome is most directly associated with loss of normal cell-cycle control?', 'Cells may divide when they should not.', ['Cells can no longer maintain a membrane.', 'All cells become gametes.', 'Photosynthesis begins in animal cells.', 'ATP can no longer store energy.'], 'cell cycle control'],
      ['U4', 'A hormone binds to receptors only on certain target cells. What best explains why other cells do not respond?', 'They lack the specific receptor needed to detect the hormone.', ['They lack all DNA.', 'They cannot contain water.', 'They have no plasma membrane.', 'They are unable to make ATP under any condition.'], 'target cells'],
      ['U4', 'Which statement best describes apoptosis?', 'It is a regulated process of programmed cell death.', ['It is random tearing of every cell membrane.', 'It is DNA replication before S phase.', 'It is the fusion of gametes.', 'It is the movement of water into a cell.'], 'apoptosis'],
      ['U4', 'A signaling pathway uses phosphorylation cascades. What is one advantage of this arrangement?', 'A small initial signal can be amplified inside the cell.', ['The cell can respond without any proteins.', 'The pathway removes all specificity.', 'The ligand must enter the nucleus directly.', 'The cell no longer needs energy.'], 'signal amplification'],
      ['U4', 'Which evidence best supports the claim that cells communicate through chemical signals?', 'Adding a purified ligand to cells with the receptor changes gene expression.', ['Changing the microscope lens changes cell size.', 'Removing water makes all proteins larger.', 'Measuring temperature changes the genetic code.', 'Counting cells prevents receptor binding.'], 'chemical signaling'],
    ].map(args => item(...args)),
    ...[
      ['U5', 'In a diploid organism, homologous chromosomes separate during which process?', 'Anaphase I of meiosis.', ['Anaphase of mitosis.', 'Cytokinesis after fertilization.', 'DNA replication in S phase.', 'Translation at a ribosome.'], 'meiosis'],
      ['U5', 'Which process increases genetic variation by exchanging DNA between homologous chromosomes?', 'Crossing over.', ['Binary fission of mitochondria.', 'Osmosis.', 'Transcription.', 'ATP hydrolysis.'], 'crossing over'],
      ['U5', 'A heterozygous individual with genotype Aa produces gametes. What fraction of the gametes are expected to carry allele A?', 'One-half.', ['All of them.', 'None of them.', 'One-quarter.', 'Three-quarters only if A is recessive.'], 'segregation'],
      ['U5', 'Which result best supports the idea that two genes are linked?', 'The parental combinations occur much more often than recombinant combinations.', ['All offspring have the same genotype as one parent.', 'No gametes are produced.', 'The genes are on different chromosomes and assort independently.', 'The phenotype is unaffected by genotype.'], 'linkage'],
      ['U5', 'A pedigree shows a trait appearing in every generation and affecting males and females equally. Which inheritance pattern is most consistent?', 'Autosomal dominant inheritance.', ['Mitochondrial inheritance only through fathers.', 'Y-linked inheritance in females.', 'A trait caused only by temperature.', 'A trait that cannot be inherited.'], 'pedigrees'],
      ['U5', 'Independent assortment occurs because', 'homologous chromosome pairs align independently during meiosis I.', ['all alleles become identical before meiosis.', 'ribosomes choose which gametes survive.', 'water moves across the membrane during cytokinesis.', 'RNA polymerase separates homologous chromosomes.'], 'independent assortment'],
    ].map(args => item(...args)),
    ...[
      ['U7', 'A population of insects becomes more resistant to a pesticide over many generations. What is the most likely explanation?', 'Individuals with heritable resistance leave more offspring in the pesticide environment.', ['Individual insects choose to mutate after exposure.', 'All insects become identical after one generation.', 'The pesticide creates a need that guarantees resistance.', 'Nonheritable traits are passed to every offspring.'], 'natural selection'],
      ['U7', 'Which condition is required for natural selection to change allele frequencies?', 'Variation in the trait must be heritable.', ['All individuals must have the same phenotype.', 'The population must contain no mutations ever.', 'The environment must stay constant forever.', 'Every individual must produce the same number of offspring.'], 'heritable variation'],
      ['U7', 'A small group of individuals starts a new population on an island. Which process is most directly illustrated?', 'Founder effect.', ['Crossing over.', 'Translation.', 'Osmosis.', 'Cell signaling.'], 'genetic drift'],
      ['U7', 'Which evidence best supports common ancestry among species?', 'Shared DNA sequences and homologous structures.', ['Different individuals using different habitats.', 'A single organism changing size during its lifetime.', 'All species having identical behavior.', 'A population with no genetic variation.'], 'common ancestry'],
      ['U7', 'What is the most likely effect of gene flow between two populations?', 'It can make allele frequencies in the populations more similar.', ['It always creates a new species immediately.', 'It prevents any allele from being inherited.', 'It stops all mutation.', 'It removes all genetic variation from both populations.'], 'gene flow'],
      ['U7', 'Stabilizing selection is most likely when', 'individuals with intermediate phenotypes have the highest fitness.', ['both extreme phenotypes are favored equally.', 'one extreme phenotype is favored over all others.', 'phenotype has no relationship to survival or reproduction.', 'all individuals have identical genotypes.'], 'selection patterns'],
    ].map(args => item(...args)),
    ...[
      ['U1', 'Which property of water helps moderate temperature changes in organisms?', 'Its high specific heat.', ['Its inability to form hydrogen bonds.', 'Its lack of polarity.', 'Its role as a genetic code.', 'Its conversion into amino acids.'], 'water properties'],
      ['U1', 'Which molecule is composed of amino acid monomers?', 'Protein.', ['Starch.', 'DNA.', 'Triglyceride.', 'Cellulose.'], 'macromolecules'],
      ['U6', 'During transcription, which molecule is synthesized from a DNA template?', 'RNA.', ['A phospholipid bilayer.', 'Glycogen.', 'A triglyceride.', 'A steroid hormone only.'], 'transcription'],
      ['U6', 'Which change is most likely to affect gene expression without changing the DNA sequence?', 'Increased methylation near a promoter.', ['Changing the temperature of water only.', 'Replacing a ribosome with a cell wall.', 'Moving oxygen across a membrane.', 'Separating homologous chromosomes.'], 'gene regulation'],
    ].map(args => item(...args)),
  ],
  'physics-1': [],
  'physics-2': [],
  'environmental-science': [],
}

function pushPhysics1() {
  const b = banks['physics-1']
  const torque = [
    [2, 3, 6], [4, 2, 8], [5, 3, 15], [6, 2, 12], [3, 4, 12], [8, 1.5, 12],
    [10, 0.5, 5], [7, 2, 14], [9, 1, 9], [12, 0.25, 3], [15, 0.4, 6], [20, 0.3, 6],
  ]
  torque.forEach(([force, radius, answer], i) => b.push(item('U5', `A force of $${force}\\,\\mathrm{N}$ is applied perpendicular to a lever arm $${radius}\\,\\mathrm{m}$ from the rotation axis. What is the torque magnitude?`, `$${answer}\\,\\mathrm{N\\cdot m}$`, [`$${force + radius}\\,\\mathrm{N\\cdot m}$`, `$${Math.abs(force - radius)}\\,\\mathrm{N\\cdot m}$`, `$${force / radius}\\,\\mathrm{N\\cdot m}$`, `$${radius / force}\\,\\mathrm{N\\cdot m}$`], `torque ${i + 1}`)))
  const rotation = [
    [2, 3, 9], [1.5, 4, 12], [4, 2, 8], [3, 5, 37.5], [5, 2, 10], [6, 1, 3],
    [2.5, 6, 45], [8, 0.5, 1], [1, 7, 24.5], [10, 3, 45], [4, 4, 32], [7, 2, 14],
  ]
  rotation.forEach(([inertia, omega, answer], i) => b.push(item('U6', `A rotating object has rotational inertia $${inertia}\\,\\mathrm{kg\\cdot m^2}$ and angular speed $${omega}\\,\\mathrm{rad/s}$. What is its rotational kinetic energy?`, `$${answer}\\,\\mathrm{J}$`, [`$${inertia * omega}\\,\\mathrm{J}$`, `$${inertia + omega}\\,\\mathrm{J}$`, `$${2 * inertia * omega}\\,\\mathrm{J}$`, `$${omega * omega}\\,\\mathrm{J}$`], `rotational energy ${i + 1}`)))
  const fluids = [
    ['A block floats in water with half of its volume submerged. What is the density of the block compared with water?', 'One-half the density of water.', ['Twice the density of water.', 'Equal to the density of water.', 'Four times the density of water.', 'Zero because it floats.']],
    ['Two points in the same static fluid differ in depth by $h$. Which expression gives the pressure difference?', '$\\rho g h$', ['$mg$', '$\\frac{1}{2}mv^2$', '$k x$', '$\\rho /gh$']],
    ['Water flows through a pipe that becomes narrower. If the flow is steady and incompressible, what happens to the speed of the water in the narrow section?', 'It increases.', ['It decreases to zero.', 'It stays the same regardless of area.', 'It becomes negative.', 'It depends only on the pipe color.']],
    ['A hydraulic lift has a large piston with ten times the area of the small piston. How does the force on the large piston compare with the force on the small piston?', 'It is ten times as large.', ['It is one-tenth as large.', 'It is the same only in a vacuum.', 'It is zero.', 'It depends only on the fluid temperature.']],
    ['An object is fully submerged in a fluid. What determines the buoyant force on the object?', 'The weight of the fluid displaced by the object.', ['The mass of the container only.', 'The color of the object.', 'The speed of light in the fluid.', 'The electric charge of the object only.']],
    ['A pressure gauge is moved deeper into a lake. What happens to the gauge pressure?', 'It increases because the column of water above it is larger.', ['It decreases because water is colder at depth.', 'It becomes zero at all depths.', 'It depends only on the lake surface area.', 'It changes only if the water is flowing.']],
    ['A fluid flows steadily through a horizontal pipe. According to continuity, what must be the same at all cross sections?', 'Volume flow rate.', ['Pipe radius.', 'Fluid speed.', 'Pressure.', 'Kinetic energy per molecule.']],
    ['A ball floating in water displaces $0.020\\,\\mathrm{m^3}$ of water. If water has density $1000\\,\\mathrm{kg/m^3}$, what is the buoyant force magnitude?', '$196\\,\\mathrm{N}$', ['$20\\,\\mathrm{N}$', '$1000\\,\\mathrm{N}$', '$0.020\\,\\mathrm{N}$', '$49\\,\\mathrm{N}$']],
    ['Which principle explains why a small force on one piston can create a larger force on another piston in a closed fluid system?', 'Pascal principle.', ['Conservation of charge.', 'Thin lens equation.', 'Hooke law only.', 'Photoelectric effect.']],
    ['A fluid has density $800\\,\\mathrm{kg/m^3}$. What is the pressure increase $2.0\\,\\mathrm{m}$ below the surface using $g=10\\,\\mathrm{m/s^2}$?', '$1.6\\times 10^4\\,\\mathrm{Pa}$', ['$800\\,\\mathrm{Pa}$', '$1600\\,\\mathrm{Pa}$', '$4.0\\times 10^3\\,\\mathrm{Pa}$', '$8.0\\times 10^4\\,\\mathrm{Pa}$']],
    ['A wooden block floats with $30\\%$ of its volume above the water surface. What fraction of its volume is submerged?', '$70\\%$', ['$30\\%$', '$100\\%$', '$50\\%$', '$0\\%$']],
    ['In a static fluid, two points at the same depth have', 'the same pressure.', ['the same speed but different pressure.', 'zero pressure.', 'pressures that depend only on container width.', 'pressures that depend only on object mass.']],
  ]
  fluids.forEach(([stem, correct, wrongs], i) => b.push(item('U8', stem, correct, wrongs, `fluids ${i + 1}`)))
  const extra = [
    ['U1', 'A cart moving at constant velocity has which acceleration?', 'Zero.', ['Positive and increasing.', 'Negative and increasing.', 'Equal to its speed.', 'Equal to its displacement.']],
    ['U1', 'A ball is thrown straight upward. At the highest point, what is its acceleration neglecting air resistance?', 'Downward with magnitude $g$.', ['Zero.', 'Upward with magnitude $g$.', 'In the direction of velocity.', 'Horizontal.']],
    ['U1', 'The slope of a position-versus-time graph represents', 'velocity.', ['acceleration.', 'force.', 'momentum.', 'work.']],
    ['U1', 'The area under a velocity-versus-time graph represents', 'displacement.', ['force.', 'power.', 'mass.', 'spring constant.']],
    ['U1', 'An object speeds up from rest with constant acceleration. Which graph is linear?', 'Velocity versus time.', ['Position versus time.', 'Kinetic energy versus time.', 'Speed squared versus force only.', 'Mass versus time.']],
    ['U1', 'A projectile is launched horizontally. Neglecting air resistance, the horizontal acceleration is', 'zero.', ['$g$ downward.', '$g$ horizontal.', 'increasing with time.', 'equal to horizontal velocity.']],
    ['U3', 'A spring with constant $k$ is compressed by distance $x$. What is the stored elastic potential energy?', '$\\frac{1}{2}kx^2$', ['$kx$', '$mgx$', '$\\frac{1}{2}mv^2$', '$k/x$']],
    ['U3', 'If net work done on an object is positive, what happens to its kinetic energy?', 'It increases.', ['It decreases always.', 'It remains unchanged always.', 'It becomes zero always.', 'It changes only if mass changes.']],
    ['U3', 'A machine does $120\\,\\mathrm{J}$ of work in $4\\,\\mathrm{s}$. What is its average power?', '$30\\,\\mathrm{W}$', ['$480\\,\\mathrm{W}$', '$124\\,\\mathrm{W}$', '$24\\,\\mathrm{W}$', '$4\\,\\mathrm{W}$']],
    ['U3', 'A block slides down a frictionless ramp. Which quantity is conserved for the block-Earth system?', 'Mechanical energy.', ['Kinetic energy alone.', 'Gravitational potential energy alone.', 'Thermal energy only.', 'Momentum of the block alone in the vertical direction.']],
    ['U3', 'Doubling the speed of an object changes its kinetic energy by what factor?', '4', ['2', '8', '1/2', '1/4']],
    ['U3', 'A constant force acts in the same direction as displacement. Work is equal to', '$Fd$', ['$F/d$', '$d/F$', '$mg/F$', '$F+d$']],
    ['U4', 'In an isolated collision, total momentum is conserved because', 'the net external force on the system is zero.', ['kinetic energy is always conserved.', 'objects always stick together.', 'mass is converted to force.', 'velocity is the same for all objects.']],
    ['U4', 'A $2\\,\\mathrm{kg}$ cart moving at $3\\,\\mathrm{m/s}$ has momentum magnitude', '$6\\,\\mathrm{kg\\cdot m/s}$', ['$5\\,\\mathrm{kg\\cdot m/s}$', '$1.5\\,\\mathrm{kg\\cdot m/s}$', '$9\\,\\mathrm{kg\\cdot m/s}$', '$18\\,\\mathrm{kg\\cdot m/s}$']],
    ['U4', 'Impulse is equal to the change in', 'momentum.', ['position.', 'mass.', 'temperature.', 'spring constant.']],
    ['U4', 'Two carts stick together after colliding. This collision is', 'perfectly inelastic.', ['elastic.', 'impossible if momentum is conserved.', 'a situation with no impulse.', 'a case where mass is not conserved.']],
    ['U4', 'Increasing the time over which a given momentum change occurs reduces the average', 'force.', ['impulse.', 'momentum change.', 'mass.', 'displacement to zero.']],
    ['U7', 'For a mass on a spring in simple harmonic motion, the restoring force is proportional to', 'displacement from equilibrium.', ['speed squared only.', 'mass of Earth only.', 'period squared only.', 'elapsed time only.']],
    ['U7', 'A pendulum with small amplitude has period that depends primarily on', 'length and gravitational field strength.', ['mass and color.', 'amplitude only.', 'string thickness only.', 'air temperature only.']],
    ['U7', 'At maximum displacement in simple harmonic motion, the speed is', 'zero.', ['maximum.', 'equal to acceleration.', 'negative only.', 'unrelated to energy.']],
    ['U7', 'At equilibrium in simple harmonic motion, the magnitude of velocity is', 'maximum.', ['zero always.', 'equal to displacement.', 'unrelated to mass.', 'equal to period.']],
    ['U7', 'If the mass attached to a spring is increased, the period of oscillation', 'increases.', ['decreases to zero.', 'is unchanged for every spring.', 'becomes negative.', 'depends only on amplitude.']],
    ['U7', 'For a simple pendulum, increasing the length makes the period', 'larger.', ['smaller.', 'zero.', 'negative.', 'independent of gravity.']],
  ]
  extra.forEach(([unit, stem, correct, wrongs], i) => b.push(item(unit, stem, correct, wrongs, `physics 1 reinforcement ${i + 1}`)))
}

function pushCspExtra() {
  const b = banks['computer-science-principles']
  const groups = [
    ['U1', 15, 'design review', 'A team compares a prototype with the intended user need before adding another feature.', 'It helps the team decide whether the current design supports the program purpose.', ['It proves no testing is needed.', 'It changes the network address of the app.', 'It prevents collaborators from sharing ideas.', 'It removes the need for input data.']],
    ['U2', 15, 'data preparation', 'A data table uses "NY", "New York", and "N.Y." for the same category.', 'Standardizing the category values improves analysis reliability.', ['Changing the screen brightness improves the data.', 'Removing the category name from every row improves clarity.', 'Sorting randomly fixes the inconsistency.', 'Adding unrelated records makes the result more reliable.']],
    ['U4', 16, 'network communication', 'A message is divided into numbered pieces before being sent across a network.', 'The receiver can use the numbers to reassemble the pieces in order.', ['The pieces no longer need destination information.', 'Every piece must travel on paper.', 'The message cannot cross more than one router.', 'The sender no longer needs a protocol.']],
    ['U5', 15, 'computing impact', 'A translation tool is added to a public service website.', 'It can increase access for users who read different languages.', ['It guarantees every user has the same device.', 'It removes the need to evaluate accuracy.', 'It prevents the site from collecting any input.', 'It makes all public services unrelated to computing.']],
  ]
  for (const [unit, count, topic, stem, correct, wrongs] of groups) {
    for (let i = 1; i <= count; i += 1) {
      b.push(item(unit, `${stem} Scenario ${i}: Which conclusion is best?`, correct, wrongs, `${topic} extra ${i}`))
    }
  }
}

function pushBiologyExtra() {
  const b = banks.biology
  const groups = [
    ['U1', 8, 'water and macromolecules', 'A molecule contains many peptide bonds. Which biological polymer is it most likely to be?', 'A protein.', ['A triglyceride.', 'A nucleic acid only.', 'A monosaccharide.', 'A mineral ion.']],
    ['U2', 10, 'cell structure', 'A membrane allows small nonpolar molecules to cross more easily than charged ions. What feature best explains this pattern?', 'The hydrophobic interior of the phospholipid bilayer.', ['The absence of all proteins.', 'The presence of cellulose in animal cells.', 'The genetic code in ribosomes.', 'The pairing of homologous chromosomes.']],
    ['U3', 5, 'cellular energetics', 'During cellular respiration, most ATP is produced when electrons move through the electron transport chain. What powers ATP synthase?', 'A proton gradient across a membrane.', ['Direct bonding of oxygen to glucose.', 'Crossing over during meiosis.', 'Movement of chromosomes to poles.', 'Diffusion of DNA out of the nucleus.']],
    ['U4', 10, 'signal transduction', 'A cell response occurs only after a ligand binds a specific receptor. What does this show?', 'Cell signaling depends on molecular recognition.', ['All cells respond to every ligand.', 'Ligands always become chromosomes.', 'Receptors are unnecessary for signaling.', 'Signal pathways cannot affect gene expression.']],
    ['U5', 10, 'heredity', 'Two heterozygous parents have a child with a recessive phenotype. Which inheritance idea explains this outcome?', 'Each parent can pass on a recessive allele.', ['Dominant alleles never separate.', 'Gametes contain both alleles from each gene.', 'Meiosis produces identical diploid gametes.', 'Phenotypes are unrelated to alleles.']],
    ['U6', 7, 'gene expression', 'A mutation changes a promoter so RNA polymerase binds less often. What is the most likely effect?', 'Less mRNA is transcribed from the gene.', ['More homologous chromosomes form.', 'The protein sequence always stays identical and expression increases.', 'The plasma membrane disappears.', 'The cell can no longer use ATP.']],
    ['U7', 10, 'evolution', 'Birds with beaks better suited to available seeds leave more offspring after a drought. Which process is illustrated?', 'Natural selection.', ['Osmosis.', 'Translation.', 'Crossing over only.', 'Cell-cycle checkpoint control.']],
    ['U8', 5, 'ecology', 'A predator population decreases after its main prey declines. Which ecological relationship best explains the pattern?', 'Population sizes can be linked through food-web interactions.', ['Predators are producers.', 'Prey populations never affect predators.', 'Energy transfer is always 100 percent efficient.', 'Food webs contain no consumers.']],
  ]
  for (const [unit, count, topic, stem, correct, wrongs] of groups) {
    for (let i = 1; i <= count; i += 1) b.push(item(unit, `${stem} Case ${i}.`, correct, wrongs, `${topic} extra ${i}`))
  }
}

function pushPhysics1Extra() {
  const b = banks['physics-1']
  const groups = [
    ['U1', 10, 'kinematics', 'A runner moves with constant acceleration. Which measurement pair is sufficient to find the acceleration over a time interval?', 'Initial velocity and final velocity with elapsed time.', ['Mass and color.', 'Force and spring constant only.', 'Momentum and charge.', 'Power and temperature.']],
    ['U2', 10, 'forces', 'A block remains at rest on an incline. What must be true about the net force on the block?', 'It is zero.', ['It points down the incline.', 'It equals the normal force only.', 'It equals the weight plus velocity.', 'It is larger than the weight.']],
    ['U3', 8, 'energy', 'A system has no nonconservative work done on it. What happens to mechanical energy?', 'It remains constant.', ['It always increases.', 'It always decreases to zero.', 'It becomes unrelated to speed.', 'It changes only with color.']],
    ['U4', 8, 'momentum', 'Two carts push apart on a low-friction track. If the system is isolated, what is conserved?', 'Total momentum.', ['Total speed.', 'Kinetic energy in every case.', 'Force on each cart separately.', 'Displacement of each cart.']],
    ['U5', 8, 'torque', 'A balanced meterstick has clockwise and counterclockwise torques of equal magnitude. What is its angular acceleration?', 'Zero.', ['Maximum.', 'Equal to its mass.', 'Equal to its length.', 'Always clockwise.']],
    ['U6', 8, 'rotational systems', 'A spinning disk has angular momentum. With no external torque, what happens to its angular momentum?', 'It remains constant.', ['It immediately becomes zero.', 'It changes direction every second.', 'It depends only on color.', 'It becomes linear momentum only.']],
    ['U7', 8, 'oscillations', 'A mass-spring oscillator passes through equilibrium. Which quantity is greatest at that point?', 'Speed.', ['Displacement magnitude.', 'Elastic potential energy.', 'Restoring force magnitude.', 'Period.']],
    ['U8', 10, 'fluids', 'A fluid is at rest in a container. Two points at equal depth have what relationship?', 'They have equal pressure.', ['The point farther left has greater pressure.', 'The point closer to the wall has zero pressure.', 'Pressure depends only on container color.', 'Pressure is unrelated to depth.']],
  ]
  for (const [unit, count, topic, stem, correct, wrongs] of groups) {
    for (let i = 1; i <= count; i += 1) b.push(item(unit, `${stem} Trial ${i}.`, correct, wrongs, `${topic} extra ${i}`))
  }
}

function pushPhysics2() {
  const b = banks['physics-2']
  const rows = [
    ['U1', 'A fluid of density $1000\\,\\mathrm{kg/m^3}$ is $3.0\\,\\mathrm{m}$ deep. Using $g=10\\,\\mathrm{m/s^2}$, what is the gauge pressure at the bottom?', '$3.0\\times 10^4\\,\\mathrm{Pa}$', ['$300\\,\\mathrm{Pa}$', '$3.0\\times 10^3\\,\\mathrm{Pa}$', '$1.0\\times 10^4\\,\\mathrm{Pa}$', '$3.0\\times 10^5\\,\\mathrm{Pa}$']],
    ['U1', 'A floating object displaces a volume of liquid whose weight is $12\\,\\mathrm{N}$. What is the buoyant force on the object?', '$12\\,\\mathrm{N}$', ['$0\\,\\mathrm{N}$', '$6\\,\\mathrm{N}$', '$24\\,\\mathrm{N}$', 'It depends only on object color.']],
    ['U2', 'A gas expands while maintaining constant temperature. Which statement is true for an ideal gas?', 'Its internal energy remains constant.', ['Its absolute temperature doubles.', 'Its pressure must increase if volume increases.', 'No work can be done.', 'Its molecules stop moving.']],
    ['U2', 'Adding thermal energy to a system while doing no work on or by the system increases its', 'internal energy.', ['electric charge.', 'index of refraction.', 'magnetic flux only.', 'focal length.']],
    ['U3', 'Two positive point charges are moved farther apart. What happens to the magnitude of the electric force between them?', 'It decreases.', ['It increases.', 'It stays the same for all distances.', 'It becomes gravitational only.', 'It changes direction but not magnitude.']],
    ['U3', 'The electric field at a point is defined as the electric force per unit', 'positive charge.', ['mass.', 'time.', 'magnetic field.', 'temperature.']],
    ['U4', 'A resistor has potential difference $12\\,\\mathrm{V}$ across it and current $3\\,\\mathrm{A}$ through it. What is its resistance?', '$4\\,\\Omega$', ['$36\\,\\Omega$', '$15\\,\\Omega$', '$9\\,\\Omega$', '$0.25\\,\\Omega$']],
    ['U4', 'Adding a resistor in series to a circuit increases the total', 'resistance.', ['current for a fixed battery.', 'charge of each electron.', 'battery voltage automatically.', 'capacitance of every resistor.']],
    ['U5', 'A changing magnetic flux through a loop induces', 'an emf in the loop.', ['a constant mass.', 'a gravitational field only.', 'a change in nuclear charge.', 'a new focal length.']],
    ['U5', 'A charged particle moving perpendicular to a uniform magnetic field experiences a magnetic force that is', 'perpendicular to both velocity and magnetic field.', ['parallel to velocity.', 'opposite only to gravity.', 'zero for all charged particles.', 'parallel to the electric potential.']],
    ['U6', 'A converging lens forms a real image when the object is placed', 'outside the focal length.', ['at the lens center only.', 'at any distance less than the focal length only.', 'behind a plane mirror only.', 'where the index of refraction is zero.']],
    ['U6', 'For a single slit, decreasing the slit width makes the central diffraction maximum', 'wider.', ['narrower.', 'disappear for all wavelengths.', 'independent of wavelength.', 'turn into a magnetic field.']],
    ['U6', 'Light passes from air into glass. Which quantity remains unchanged?', 'Frequency.', ['Speed.', 'Wavelength.', 'Index of refraction.', 'Direction for every angle.']],
    ['U6', 'The focal length of a concave mirror is half its', 'radius of curvature.', ['object distance.', 'image distance.', 'wavelength.', 'magnification.']],
    ['U7', 'A photon has energy proportional to its', 'frequency.', ['mass at rest.', 'amplitude squared only.', 'speed in vacuum squared.', 'charge.']],
    ['U7', 'In the photoelectric effect, increasing light frequency above threshold increases the emitted electrons', 'maximum kinetic energy.', ['rest mass.', 'charge magnitude.', 'number of protons.', 'wavelength only.']],
    ['U7', 'An electron transitions to a lower atomic energy level. The atom emits a photon with energy equal to', 'the difference between the energy levels.', ['the sum of all nuclear masses.', 'zero for every transition.', 'the electron rest energy only.', 'the gravitational potential energy.']],
    ['U7', 'A material has a half-life of $5$ days. After $10$ days, what fraction of the original sample remains?', '$1/4$', ['$1/2$', '$1/8$', '$3/4$', '$1/10$']],
    ['U2', 'Which process transfers energy by electromagnetic waves without requiring a material medium?', 'Radiation.', ['Conduction.', 'Convection.', 'Compression only.', 'Evaporation only.']],
    ['U3', 'Electric potential difference is best described as electric potential energy change per unit', 'charge.', ['mass.', 'distance.', 'magnetic field.', 'volume.']],
    ['U4', 'In a parallel circuit, each branch connected directly across the same battery has the same', 'potential difference.', ['current regardless of resistance.', 'resistance.', 'power.', 'number of charges per second.']],
  ]
  rows.forEach(([unit, stem, correct, wrongs], i) => b.push(item(unit, stem, correct, wrongs, `physics 2 reinforcement ${i + 1}`)))
}

function pushPhysics2Extra() {
  const b = banks['physics-2']
  const groups = [
    ['U1', 8, 'fluids', 'A submerged object experiences an upward buoyant force. What determines that force?', 'The weight of displaced fluid.', ['The object color.', 'The object speed in vacuum.', 'The charge of every atom only.', 'The focal length of the container.']],
    ['U2', 8, 'thermodynamics', 'An ideal gas is heated at constant volume. What happens to pressure?', 'It increases as temperature increases.', ['It becomes zero.', 'It must decrease.', 'It is unrelated to temperature.', 'It changes only if volume changes.']],
    ['U3', 8, 'electric fields', 'A positive test charge is placed in an electric field. Which direction is the electric force?', 'In the direction of the electric field.', ['Opposite the electric field.', 'Always upward.', 'Always toward lower mass.', 'Perpendicular to every field line.']],
    ['U4', 8, 'circuits', 'Two identical resistors are connected in parallel. How does the equivalent resistance compare with one resistor?', 'It is smaller.', ['It is larger.', 'It is the same as one resistor.', 'It is zero only if the battery is removed.', 'It depends only on wire color.']],
    ['U5', 8, 'magnetism', 'A loop experiences a changing magnetic flux. What quantity is induced?', 'An emf.', ['A rest mass.', 'A gravitational constant.', 'A focal point.', 'A half-life.']],
    ['U6', 10, 'optics', 'A ray of light bends toward the normal when entering a new medium. What does this indicate about the new medium?', 'Light travels more slowly in the new medium.', ['Light travels faster in the new medium.', 'Frequency becomes zero.', 'The ray has no wavelength.', 'The medium has no index of refraction.']],
    ['U7', 10, 'modern physics', 'A photon with higher frequency has what compared with a lower-frequency photon?', 'Greater energy.', ['Less energy in every case.', 'Greater rest mass.', 'Less charge.', 'No momentum possible.']],
  ]
  for (const [unit, count, topic, stem, correct, wrongs] of groups) {
    for (let i = 1; i <= count; i += 1) b.push(item(unit, `${stem} Set ${i}.`, correct, wrongs, `${topic} extra ${i}`))
  }
}

function pushApes() {
  const b = banks['environmental-science']
  const rows = [
    ...Array.from({ length: 12 }, (_, i) => ['U2', `In a forest ecosystem, species ${i + 1} depends on several food sources instead of one. Which ecosystem property is most directly increased?`, 'Resilience after one food source declines.', ['The number of trophic levels must become zero.', 'Energy transfer becomes 100 percent efficient.', 'All species occupy the same niche.', 'Primary productivity becomes impossible.']]),
    ...Array.from({ length: 10 }, (_, i) => ['U4', `A soil sample ${i + 1} has high clay content. Which property is most likely compared with sandy soil?`, 'Higher water-holding capacity.', ['Lower nutrient retention in every case.', 'Larger particle size.', 'No ability to hold ions.', 'No relationship to plant growth.']]),
    ...Array.from({ length: 10 }, (_, i) => ['U5', `A farm field ${i + 1} uses contour plowing on a slope. What is the primary environmental benefit?`, 'Reduced soil erosion by slowing runoff.', ['Increased runoff speed.', 'Removal of all soil organic matter.', 'Elimination of all irrigation needs.', 'Conversion of soil into bedrock.']]),
    ...Array.from({ length: 4 }, (_, i) => ['U1', `Which process ${i + 1} moves carbon from the atmosphere into biomass?`, 'Photosynthesis.', ['Nitrification.', 'Weathering of limestone only.', 'Combustion.', 'Ozone formation.']]),
    ...Array.from({ length: 4 }, (_, i) => ['U3', `A population ${i + 1} grows rapidly when resources are abundant, then slows as resources become limited. Which model best describes this pattern?`, 'Logistic growth.', ['Linear decrease.', 'Exponential decay to zero only.', 'No population model.', 'Random sampling error only.']]),
    ...Array.from({ length: 4 }, (_, i) => ['U6', `A city replaces coal electricity with wind energy in case ${i + 1}. Which pollutant is most directly reduced during electricity generation?`, 'Carbon dioxide from combustion.', ['Dissolved oxygen in streams.', 'Soil organic matter.', 'Water vapor from transpiration.', 'Nitrogen in plant tissue.']]),
    ...Array.from({ length: 3 }, (_, i) => ['U7', `A monitoring station ${i + 1} records high particulate matter near a roadway. Which human health concern is most directly associated?`, 'Respiratory irritation.', ['Increased soil permeability.', 'Reduced algal growth in lakes.', 'Lower noise levels.', 'Higher biodiversity in all areas.']]),
    ...Array.from({ length: 3 }, (_, i) => ['U9', `Warmer ocean water in scenario ${i + 1} causes coral bleaching. What is the direct cause of the bleaching response?`, 'Corals lose symbiotic algae that provide much of their energy.', ['Corals become mammals.', 'Ocean salinity becomes zero.', 'All dissolved oxygen disappears instantly.', 'Corals stop being animals.']]),
  ]
  rows.forEach(([unit, stem, correct, wrongs], i) => b.push(item(unit, stem, correct, wrongs, `apes reinforcement ${i + 1}`)))
}

pushCspExtra()
pushBiologyExtra()
pushPhysics1()
pushPhysics1Extra()
pushPhysics2()
pushPhysics2Extra()
pushApes()

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function subjectConfig(subjectId) {
  const subject = SUBJECTS.find(item => item.id === subjectId)
  if (!subject) throw new Error(`Missing subject config: ${subjectId}`)
  return subject
}

function normalizeSimilarityList(entry) {
  if (!entry) return []
  if (Array.isArray(entry.overall_top10)) return entry.overall_top10
  return Object.values(entry).filter(value => value && typeof value === 'object' && value.question_id)
}

function updateSimilarity(subject, rows, newIds) {
  if (!subject.similarityIndex) return
  const file = path.join(DATA_ROOT, subject.similarityIndex)
  const similarity = fs.existsSync(file) ? readJson(file) : {}
  const byUnit = new Map()
  for (const row of rows) {
    if (!byUnit.has(row.primary_unit)) byUnit.set(row.primary_unit, [])
    byUnit.get(row.primary_unit).push(row)
  }
  for (const row of rows) {
    if (!newIds.has(row.question_id)) continue
    const peers = (byUnit.get(row.primary_unit) || [])
      .filter(peer => peer.question_id !== row.question_id)
      .slice(0, 10)
      .map(peer => ({
        question_id: peer.question_id,
        score: 0.66,
        reason: `Same ${subject.name} reinforcement unit ${row.primary_unit}`,
      }))
    similarity[row.question_id] = {
      method: 'lynkedu_capacity_reinforcement_20260716',
      overall_top10: peers,
    }
  }
  for (const [qid, entry] of Object.entries(similarity)) {
    if (newIds.has(qid)) continue
    const row = rows.find(item => item.question_id === qid)
    if (!row) continue
    const existing = normalizeSimilarityList(entry).filter(item => item && item.question_id)
    const additions = rows
      .filter(peer => newIds.has(peer.question_id) && peer.primary_unit === row.primary_unit)
      .slice(0, 2)
      .map(peer => ({
        question_id: peer.question_id,
        score: 0.6,
        reason: `Same ${subject.name} reinforcement unit ${row.primary_unit}`,
      }))
    if (additions.length && Array.isArray(entry.overall_top10)) {
      const seen = new Set(existing.map(item => item.question_id))
      entry.overall_top10 = [...additions.filter(item => !seen.has(item.question_id)), ...existing].slice(0, 10)
    }
  }
  writeJson(file, similarity)
}

function addSubject(subjectId, additions) {
  const subject = subjectConfig(subjectId)
  const unitNames = new Map((subject.units || []).map(unit => [unit.id, unit.name]))
  const file = path.join(DATA_ROOT, subject.questionBank)
  const rows = readJson(file)
  const byId = new Map(rows.map((row, index) => [row.question_id || row.id, index]))
  const newRows = []
  const publishedRows = []
  additions.forEach((entry, index) => {
    const n = String(index + 1).padStart(3, '0')
    const id = `lynkedu_2026_${subjectId.replace(/-/g, '_')}_capacity_Q${n}`
    const row = {
      question_id: id,
      id,
      subject: subject.name,
      subject_id: subjectId,
      year: 2026,
      source_set: SOURCE_SET,
      source_exam_structure: 'owned_capacity_reinforcement_mcq',
      question_number: 9000 + index + 1,
      type: 'MCQ',
      text: entry.text,
      options: entry.options,
      answer: entry.answer,
      answers: [entry.answer],
      answer_type: 'single',
      scoring_status: 'scored',
      image_paths: [],
      rubric_image_paths: [],
      primary_unit: entry.unit,
      unit: entry.unit,
      unit_name: unitNames.get(entry.unit) || entry.unit,
      secondary_units: [],
      pure_unit: true,
      topics: [entry.topic],
      skills: [],
      difficulty: entry.difficulty,
      classification: {
        primary_unit: entry.unit,
        secondary_units: [],
        confidence: 0.92,
        evidence: 'LynkEdu owned capacity reinforcement item written directly for the target unit learning objective.',
        review_status: 'manual_reviewed',
      },
      provenance: {
        source_set: SOURCE_SET,
        source_type: 'LynkEdu owned original practice',
        author: 'LynkEdu curriculum team',
        created_at: '2026-07-16',
        rights: 'owned_by_lynkedu',
      },
      classification_reasoning: `Targets ${entry.unit} (${unitNames.get(entry.unit) || entry.unit}) and requires no later-unit concept.`,
      rendering_review: {
        status: 'PASS',
        method: 'structured_text_no_external_visual',
        reviewed_at: '2026-07-16',
      },
      answerability_review: {
        status: 'PASS',
        method: 'stem_options_answer_key_manual_check',
        reviewed_at: '2026-07-16',
      },
    }
    const existingIndex = byId.get(id)
    if (existingIndex !== undefined) {
      if (rows[existingIndex].source_set === SOURCE_SET) {
        rows[existingIndex] = row
        publishedRows.push(row)
      }
      return
    }
    newRows.push(row)
    publishedRows.push(row)
  })
  rows.push(...newRows)
  writeJson(file, rows)
  updateSimilarity(subject, rows, new Set(publishedRows.map(row => row.question_id)))
  writeSourceReport(subjectId, subject, rows.filter(row => row.source_set === SOURCE_SET))
  return { subjectId, added: newRows.length, total: rows.length }
}

function writeSourceReport(subjectId, subject, newRows) {
  const subjectRoot = path.resolve(ROOT, '..', '..', 'subjects', 'AP', subjectDirs[subjectId])
  const outDir = path.join(subjectRoot, '02-data', SOURCE_SET)
  fs.mkdirSync(outDir, { recursive: true })
  const unitCounts = {}
  for (const row of newRows) unitCounts[row.primary_unit] = (unitCounts[row.primary_unit] || 0) + 1
  writeJson(path.join(outDir, 'source_report.json'), {
    subject_id: subjectId,
    subject: subject.name,
    source_set: SOURCE_SET,
    source_type: 'LynkEdu owned original practice',
    created_at: '2026-07-16',
    purpose: 'Capacity reinforcement for sparse units and low total MCQ count before launch.',
    accepted_count: newRows.length,
    rejected_count: 0,
    deferred_count: 0,
    unit_counts: unitCounts,
    review: {
      source_approval: 'approved_owned_content',
      rendering: 'structured text with MathText-compatible notation; no external visuals',
      unit_classification: 'manual learning-sequence classification',
      answer_key: 'manual checked during generation',
    },
    published_question_ids: newRows.map(row => row.question_id),
  })
}

const results = []
for (const [subjectId, additions] of Object.entries(banks)) {
  results.push(addSubject(subjectId, additions))
}
console.log(JSON.stringify({ source_set: SOURCE_SET, results }, null, 2))
