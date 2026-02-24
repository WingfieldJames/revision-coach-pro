export interface OCRPhysicsSpecPoint {
  code: string;
  name: string;
  module: number; // 1-6
  keywords: string[];
}

export interface OCRPhysicsPastPaperQuestion {
  paper: string;
  year: number;
  section: string;
  number: string;
  question: string;
  marks: number;
  specCodes: string[];
}

// ===== OCR A-Level Physics A (H556) Specification Points =====
export const OCR_PHYSICS_SPEC_POINTS: OCRPhysicsSpecPoint[] = [
  // Module 2: Foundations of physics
  { code: "2.1.1", name: "Physical quantities and SI units", module: 2, keywords: ["si units", "base units", "derived units", "physical quantities", "prefixes"] },
  { code: "2.1.2", name: "Making measurements and analysing data", module: 2, keywords: ["uncertainty", "percentage uncertainty", "error", "accuracy", "precision", "significant figures"] },
  { code: "2.2.1", name: "Scalars and vectors", module: 2, keywords: ["scalar", "vector", "resultant", "resolve", "component", "magnitude", "direction"] },

  // Module 3: Forces and motion
  { code: "3.1.1", name: "Kinematics: motion graphs and equations", module: 3, keywords: ["displacement", "velocity", "acceleration", "suvat", "motion graphs", "distance-time", "velocity-time"] },
  { code: "3.1.2", name: "Projectile motion", module: 3, keywords: ["projectile", "horizontal", "vertical", "trajectory", "parabolic", "free fall"] },
  { code: "3.2.1", name: "Newton's laws of motion", module: 3, keywords: ["newton", "force", "mass", "acceleration", "f=ma", "inertia", "net force", "resultant force"] },
  { code: "3.2.2", name: "Momentum and impulse", module: 3, keywords: ["momentum", "impulse", "conservation of momentum", "collision", "elastic", "inelastic", "explosion"] },
  { code: "3.3.1", name: "Work, energy and power", module: 3, keywords: ["work done", "kinetic energy", "potential energy", "power", "efficiency", "conservation of energy"] },
  { code: "3.4.1", name: "Density and pressure", module: 3, keywords: ["density", "pressure", "upthrust", "archimedes", "floating", "fluid"] },
  { code: "3.4.2", name: "Springs and Hooke's law", module: 3, keywords: ["hooke", "spring constant", "elastic", "extension", "force-extension", "elastic potential energy", "limit of proportionality"] },
  { code: "3.4.3", name: "Stress, strain and Young modulus", module: 3, keywords: ["stress", "strain", "young modulus", "tensile", "ultimate tensile strength", "elastic limit", "fracture", "ductile", "brittle"] },

  // Module 4: Electrons, waves and photons
  { code: "4.1.1", name: "Charge, current and potential difference", module: 4, keywords: ["charge", "current", "potential difference", "voltage", "coulomb", "electron flow", "conventional current"] },
  { code: "4.1.2", name: "Resistance and resistivity", module: 4, keywords: ["resistance", "resistivity", "ohm", "ohm's law", "iv characteristic", "conductor", "semiconductor"] },
  { code: "4.1.3", name: "Electrical circuits", module: 4, keywords: ["series", "parallel", "kirchhoff", "emf", "internal resistance", "potential divider", "thermistor", "ldr"] },
  { code: "4.1.4", name: "Electrical energy and power", module: 4, keywords: ["electrical power", "energy", "kilowatt hour", "kwh", "p=iv", "fuse"] },
  { code: "4.2.1", name: "Progressive waves", module: 4, keywords: ["wave", "frequency", "wavelength", "amplitude", "period", "transverse", "longitudinal", "wave speed"] },
  { code: "4.2.2", name: "Electromagnetic spectrum", module: 4, keywords: ["electromagnetic", "spectrum", "radio", "microwave", "infrared", "visible", "ultraviolet", "x-ray", "gamma"] },
  { code: "4.2.3", name: "Superposition and interference", module: 4, keywords: ["superposition", "interference", "constructive", "destructive", "path difference", "coherent", "young", "double slit"] },
  { code: "4.2.4", name: "Stationary waves", module: 4, keywords: ["stationary wave", "standing wave", "node", "antinode", "harmonic", "fundamental", "resonance"] },
  { code: "4.2.5", name: "Diffraction and diffraction gratings", module: 4, keywords: ["diffraction", "diffraction grating", "single slit", "order", "wavelength measurement"] },
  { code: "4.3.1", name: "Refraction and total internal reflection", module: 4, keywords: ["refraction", "snell", "refractive index", "total internal reflection", "critical angle", "optical fibre"] },
  { code: "4.4.1", name: "Photon model and photoelectric effect", module: 4, keywords: ["photon", "photoelectric", "work function", "threshold frequency", "einstein", "planck", "e=hf"] },
  { code: "4.4.2", name: "Wave-particle duality", module: 4, keywords: ["wave-particle duality", "de broglie", "electron diffraction", "matter wave"] },

  // Module 5: Newtonian world and astrophysics
  { code: "5.1.1", name: "Thermal energy and specific heat capacity", module: 5, keywords: ["thermal energy", "specific heat capacity", "temperature", "heat transfer", "internal energy"] },
  { code: "5.1.2", name: "Ideal gases and kinetic theory", module: 5, keywords: ["ideal gas", "gas law", "pressure", "volume", "temperature", "boltzmann", "kinetic theory", "rms speed", "pv=nrt"] },
  { code: "5.1.3", name: "Absolute zero and gas experiments", module: 5, keywords: ["absolute zero", "kelvin", "charles law", "boyle's law", "pressure law"] },
  { code: "5.2.1", name: "Circular motion", module: 5, keywords: ["circular motion", "centripetal", "angular velocity", "radians", "period", "frequency", "centripetal force", "centripetal acceleration"] },
  { code: "5.2.2", name: "Simple harmonic motion", module: 5, keywords: ["simple harmonic motion", "shm", "oscillation", "displacement", "amplitude", "period", "restoring force", "spring", "pendulum"] },
  { code: "5.2.3", name: "Forced vibrations and resonance", module: 5, keywords: ["resonance", "forced vibration", "damping", "natural frequency", "driving frequency", "amplitude-frequency"] },
  { code: "5.3.1", name: "Gravitational fields", module: 5, keywords: ["gravitational field", "field strength", "gravitational force", "inverse square", "radial field", "uniform field"] },
  { code: "5.3.2", name: "Gravitational potential and orbits", module: 5, keywords: ["gravitational potential", "escape velocity", "orbit", "satellite", "geostationary", "kepler", "orbital period", "orbital speed"] },
  { code: "5.4.1", name: "Stars and the Hertzsprung-Russell diagram", module: 5, keywords: ["star", "main sequence", "hertzsprung-russell", "hr diagram", "luminosity", "temperature", "stellar evolution"] },
  { code: "5.4.2", name: "Cosmology and the expanding universe", module: 5, keywords: ["hubble", "redshift", "big bang", "expanding universe", "cosmic microwave background", "dark matter", "dark energy", "doppler"] },

  // Module 6: Particles and medical physics
  { code: "6.1.1", name: "Capacitance and capacitors", module: 6, keywords: ["capacitance", "capacitor", "charge", "energy stored", "parallel plate", "dielectric", "farad"] },
  { code: "6.1.2", name: "Charging and discharging capacitors", module: 6, keywords: ["charging", "discharging", "time constant", "exponential decay", "rc circuit", "capacitor discharge"] },
  { code: "6.2.1", name: "Electric fields", module: 6, keywords: ["electric field", "field strength", "coulomb's law", "electric potential", "field lines", "uniform field", "radial field"] },
  { code: "6.2.2", name: "Coulomb's law and electric potential", module: 6, keywords: ["coulomb", "point charge", "electric force", "electric potential", "equipotential"] },
  { code: "6.3.1", name: "Magnetic fields and electromagnetic induction", module: 6, keywords: ["magnetic field", "electromagnetic induction", "faraday", "lenz", "flux", "flux linkage", "emf", "generator", "transformer"] },
  { code: "6.3.2", name: "Charged particles in magnetic fields", module: 6, keywords: ["lorentz force", "charged particle", "circular motion", "magnetic force", "velocity selector", "hall effect"] },
  { code: "6.4.1", name: "Radioactivity and nuclear decay", module: 6, keywords: ["radioactive", "decay", "alpha", "beta", "gamma", "half-life", "decay constant", "activity", "nuclear equation"] },
  { code: "6.4.2", name: "Nuclear fission and fusion", module: 6, keywords: ["fission", "fusion", "binding energy", "mass defect", "chain reaction", "nuclear reactor", "e=mc2"] },
  { code: "6.4.3", name: "Nuclear radius and density", module: 6, keywords: ["nuclear radius", "nucleon", "nuclear density", "r=r0 a^1/3", "rutherford scattering"] },
  { code: "6.5.1", name: "Medical imaging: X-rays and CAT scans", module: 6, keywords: ["x-ray", "cat scan", "ct scan", "attenuation", "contrast", "radiography", "medical imaging"] },
  { code: "6.5.2", name: "Medical imaging: ultrasound", module: 6, keywords: ["ultrasound", "acoustic impedance", "b-scan", "transducer", "piezoelectric", "doppler ultrasound", "medical"] },
  { code: "6.5.3", name: "Medical imaging: PET scans and radiotherapy", module: 6, keywords: ["pet scan", "positron", "annihilation", "radiotherapy", "tracer", "gamma camera", "radionuclide"] },
  { code: "6.6.1", name: "Particle physics: quarks, leptons and hadrons", module: 6, keywords: ["quark", "lepton", "hadron", "baryon", "meson", "up quark", "down quark", "strange", "neutrino", "muon", "standard model"] },
  { code: "6.6.2", name: "Particle interactions and conservation laws", module: 6, keywords: ["conservation", "baryon number", "lepton number", "strangeness", "charge", "feynman diagram", "weak interaction", "strong force"] },
];

// ===== Past Paper Questions from 2023 & 2024 (H556/01, /02, /03) =====
export const OCR_PHYSICS_PAST_QUESTIONS: OCRPhysicsPastPaperQuestion[] = [
  // ===== June 2023 Paper 1 (H556/01) =====
  { paper: "H556/01", year: 2023, section: "A", number: "1", question: "Which row contains only scalar quantities?", marks: 1, specCodes: ["2.2.1"] },
  { paper: "H556/01", year: 2023, section: "A", number: "2", question: "Which diagram shows a torque of a couple with magnitude Fd?", marks: 1, specCodes: ["3.2.1"] },
  { paper: "H556/01", year: 2023, section: "A", number: "3", question: "The resultant force acting on a moving object is zero. Which graph shows this?", marks: 1, specCodes: ["3.1.1"] },
  { paper: "H556/01", year: 2023, section: "A", number: "4", question: "Which row correctly identifies the elastic limit, fracture and ultimate tensile strength?", marks: 1, specCodes: ["3.4.3"] },
  { paper: "H556/01", year: 2023, section: "A", number: "5", question: "A wire carries a load of 240 N. The strain is 0.30%. Which value of the Young modulus is correct?", marks: 1, specCodes: ["3.4.3"] },
  { paper: "H556/01", year: 2023, section: "A", number: "6", question: "A tennis ball is hit with a racket. What is the magnitude of the change in momentum?", marks: 1, specCodes: ["3.2.2"] },
  { paper: "H556/01", year: 2023, section: "A", number: "7", question: "Two identical spheres have a space of 3.6 m between centres. What is the gravitational force?", marks: 1, specCodes: ["5.3.1"] },
  { paper: "H556/01", year: 2023, section: "A", number: "8", question: "Elastic collision between two particles of equal mass at right angles. Which equations are correct?", marks: 1, specCodes: ["3.2.2"] },
  { paper: "H556/01", year: 2023, section: "A", number: "9", question: "During cold weather, salt causes ice to melt. Which statement about energy is correct?", marks: 1, specCodes: ["5.1.1"] },
  { paper: "H556/01", year: 2023, section: "A", number: "10", question: "Estimating absolute zero using gas pressure. Which variable must be controlled?", marks: 1, specCodes: ["5.1.3"] },
  { paper: "H556/01", year: 2023, section: "A", number: "11", question: "A geostationary satellite 36000 km above Earth. At what speed is it moving?", marks: 1, specCodes: ["5.2.1", "5.3.2"] },
  { paper: "H556/01", year: 2023, section: "A", number: "12", question: "Four oscillator systems with different damping. Which is the most heavily damped?", marks: 1, specCodes: ["5.2.3"] },
  { paper: "H556/01", year: 2023, section: "A", number: "13", question: "During inflation of the universe, which forms of matter existed 10⁻¹⁰ s after the big bang?", marks: 1, specCodes: ["5.4.2"] },
  { paper: "H556/01", year: 2023, section: "A", number: "14", question: "Emission spectrum for hydrogen and redshifted absorption spectrum from a receding galaxy", marks: 1, specCodes: ["5.4.2"] },
  { paper: "H556/01", year: 2023, section: "A", number: "15", question: "Convert the Hubble constant from km/s/Mpc to s⁻¹", marks: 1, specCodes: ["5.4.2"] },
  { paper: "H556/01", year: 2023, section: "B", number: "16", question: "Road safety: calculate speed in SI units, braking distance and force analysis", marks: 10, specCodes: ["3.1.1", "3.2.1", "3.3.1"] },
  { paper: "H556/01", year: 2023, section: "B", number: "17", question: "Fairground ride: tension, circular path radius, angular velocity, and projectile after release", marks: 12, specCodes: ["5.2.1", "3.1.2", "3.2.1"] },
  { paper: "H556/01", year: 2023, section: "B", number: "18*", question: "Compare uncertainties of two methods for determining g (vertical drop vs rolling ball)", marks: 6, specCodes: ["2.1.2", "3.1.1"] },
  { paper: "H556/01", year: 2023, section: "B", number: "19", question: "Centre of mass, bridge raising: power calculation and motor requirements", marks: 5, specCodes: ["3.2.1", "3.3.1"] },
  { paper: "H556/01", year: 2023, section: "B", number: "20", question: "Airship: upthrust, helium pressure, density and equilibrium", marks: 10, specCodes: ["3.4.1", "5.1.2"] },
  { paper: "H556/01", year: 2023, section: "B", number: "21", question: "Gravitational potential energy, kinetic energy and orbital mechanics of a satellite", marks: 8, specCodes: ["5.3.1", "5.3.2"] },

  // ===== June 2023 Paper 2 (H556/02) =====
  { paper: "H556/02", year: 2023, section: "A", number: "1", question: "Which of these units is a base unit?", marks: 1, specCodes: ["2.1.1"] },
  { paper: "H556/02", year: 2023, section: "A", number: "2", question: "Percentage difference between experimental and accepted value of g", marks: 1, specCodes: ["2.1.2"] },
  { paper: "H556/02", year: 2023, section: "A", number: "3", question: "Which statements about antiprotons, neutrons and weak nuclear force are true?", marks: 1, specCodes: ["6.6.1", "6.6.2"] },
  { paper: "H556/02", year: 2023, section: "A", number: "4", question: "Cost of using a 200W heater for 90 minutes", marks: 1, specCodes: ["4.1.4"] },
  { paper: "H556/02", year: 2023, section: "A", number: "5", question: "Direction of force on a nucleus entering a magnetic field", marks: 1, specCodes: ["6.3.2"] },
  { paper: "H556/02", year: 2023, section: "A", number: "6", question: "Which ionising radiation does Technetium-99m emit?", marks: 1, specCodes: ["6.4.1", "6.5.3"] },
  { paper: "H556/02", year: 2023, section: "A", number: "7", question: "Power dissipated across a 1kΩ resistor is 20W. What is the potential difference?", marks: 1, specCodes: ["4.1.4"] },
  { paper: "H556/02", year: 2023, section: "A", number: "8", question: "Ratio of resistivity of two copper wires with different lengths and diameters", marks: 1, specCodes: ["4.1.2"] },
  { paper: "H556/02", year: 2023, section: "A", number: "9", question: "Electrostatic force between a positron and a helium nucleus separated by 2mm", marks: 1, specCodes: ["6.2.2"] },
  { paper: "H556/02", year: 2023, section: "A", number: "10", question: "Standing wave in a tube closed at one end: nodes and wavelength", marks: 1, specCodes: ["4.2.4"] },
  { paper: "H556/02", year: 2023, section: "A", number: "11", question: "Light at glass/air interface: wavelength, refractive index and angle", marks: 1, specCodes: ["4.3.1"] },
  { paper: "H556/02", year: 2023, section: "A", number: "12", question: "Rotating coil in a generator: output at a specific instant", marks: 1, specCodes: ["6.3.1"] },
  { paper: "H556/02", year: 2023, section: "A", number: "13", question: "Rutherford scattering: work done on alpha particle approaching gold nucleus", marks: 1, specCodes: ["6.4.3", "6.2.2"] },
  { paper: "H556/02", year: 2023, section: "A", number: "14", question: "Step-down transformer: current through secondary resistor", marks: 1, specCodes: ["6.3.1"] },
  { paper: "H556/02", year: 2023, section: "A", number: "15", question: "Which statement is Faraday's law?", marks: 1, specCodes: ["6.3.1"] },
  { paper: "H556/02", year: 2023, section: "B", number: "16", question: "Young's double-slit experiment: interference, coherence, and angle calculation", marks: 9, specCodes: ["4.2.3", "4.2.5"] },
  { paper: "H556/02", year: 2023, section: "B", number: "17", question: "Ultrasound B-scans: transducer, gel, acoustic impedance and Doppler blood flow", marks: 13, specCodes: ["6.5.2"] },
  { paper: "H556/02", year: 2023, section: "B", number: "18", question: "Standing waves in a tube open at both ends: fundamental and next frequency", marks: 4, specCodes: ["4.2.4"] },
  { paper: "H556/02", year: 2023, section: "B", number: "19", question: "Electron diffraction: apparatus, pattern explanation, and de Broglie wavelength", marks: 11, specCodes: ["4.4.2"] },
  { paper: "H556/02", year: 2023, section: "B", number: "20", question: "Capacitor charging/discharging: time constant, graph analysis, and energy", marks: 12, specCodes: ["6.1.1", "6.1.2"] },
  { paper: "H556/02", year: 2023, section: "B", number: "21*", question: "Nuclear fission: chain reaction, moderator, control rods. Compare fission vs fusion", marks: 10, specCodes: ["6.4.2"] },
  { paper: "H556/02", year: 2023, section: "B", number: "22", question: "LDR potential divider circuit: jelly thickness experiment and analysis", marks: 8, specCodes: ["4.1.3"] },

  // ===== June 2023 Paper 3 (H556/03) =====
  { paper: "H556/03", year: 2023, section: "B", number: "1", question: "MAVEN spacecraft orbiting Mars: Kepler's laws, orbital data, and areostationary orbit", marks: 10, specCodes: ["5.3.2", "5.2.1"] },
  { paper: "H556/03", year: 2023, section: "B", number: "2", question: "Resistivity of a wire: measurements, uncertainty, gradient analysis and internal resistance", marks: 14, specCodes: ["4.1.2", "4.1.3", "2.1.2"] },
  { paper: "H556/03", year: 2023, section: "B", number: "3", question: "Pulsar: neutron star formation, nuclear density, radio telescope energy estimation", marks: 11, specCodes: ["5.4.1", "6.4.3"] },
  { paper: "H556/03", year: 2023, section: "B", number: "4", question: "Terminal velocity: Stokes' law, rain vs mist droplets, experimental verification", marks: 11, specCodes: ["3.2.1", "3.4.1"] },
  { paper: "H556/03", year: 2023, section: "B", number: "5", question: "Inertial confinement fusion: capacitor network, mains comparison, fusion energy calculation", marks: 9, specCodes: ["6.1.1", "6.4.2"] },
  { paper: "H556/03", year: 2023, section: "B", number: "6", question: "3D printer: heater resistance, latent heat of PLA, X-ray/radiotherapy and medical scans", marks: 15, specCodes: ["4.1.4", "5.1.1", "6.5.1", "6.5.3"] },

  // ===== June 2024 Paper 1 (H556/01) =====
  { paper: "H556/01", year: 2024, section: "A", number: "1", question: "Which row shows two equivalent physical quantities?", marks: 1, specCodes: ["2.1.1"] },
  { paper: "H556/01", year: 2024, section: "A", number: "2", question: "SI base units of the Boltzmann constant k", marks: 1, specCodes: ["2.1.1"] },
  { paper: "H556/01", year: 2024, section: "A", number: "3", question: "Rubber bung on string: which relationship between period T and radius r is correct?", marks: 1, specCodes: ["5.2.1"] },
  { paper: "H556/01", year: 2024, section: "A", number: "4", question: "Ball dropped through light gate: calculate g from timing data", marks: 1, specCodes: ["3.1.1"] },
  { paper: "H556/01", year: 2024, section: "A", number: "5", question: "Block of wood floating: what percentage of volume is above the waterline?", marks: 1, specCodes: ["3.4.1"] },
  { paper: "H556/01", year: 2024, section: "A", number: "6", question: "Uniform beam with object: normal reactions at supports", marks: 1, specCodes: ["3.2.1"] },
  { paper: "H556/01", year: 2024, section: "A", number: "7", question: "Vehicle velocity-time graph: effect of doubling initial velocity on braking", marks: 1, specCodes: ["3.1.1", "3.2.1"] },
  { paper: "H556/01", year: 2024, section: "A", number: "8", question: "Pendulum bob: small angle approximation for horizontal component of tension", marks: 1, specCodes: ["5.2.2"] },
  { paper: "H556/01", year: 2024, section: "A", number: "9", question: "Mass on spring: displacement equation for SHM", marks: 1, specCodes: ["5.2.2"] },
  { paper: "H556/01", year: 2024, section: "A", number: "10", question: "Natural frequency oscillator: which statement about resonance is correct?", marks: 1, specCodes: ["5.2.3"] },
  { paper: "H556/01", year: 2024, section: "A", number: "11", question: "Car over bridge: apparent weightlessness condition", marks: 1, specCodes: ["5.2.1"] },
  { paper: "H556/01", year: 2024, section: "A", number: "12", question: "SHM with doubled displacement: new maximum kinetic energy", marks: 1, specCodes: ["5.2.2"] },
  { paper: "H556/01", year: 2024, section: "A", number: "13", question: "Two objects collide at right angles and stick: combined velocity", marks: 1, specCodes: ["3.2.2"] },
  { paper: "H556/01", year: 2024, section: "A", number: "14", question: "Escape velocity from a planet with radius r and field strength g", marks: 1, specCodes: ["5.3.2"] },
  { paper: "H556/01", year: 2024, section: "A", number: "15", question: "Stars at galaxy edges moving faster than expected: what explains this?", marks: 1, specCodes: ["5.4.2"] },
  { paper: "H556/01", year: 2024, section: "B", number: "16", question: "Car rolling down slope: terminal velocity, F=kv², maximum speed with engine power", marks: 12, specCodes: ["3.2.1", "3.3.1"] },
  { paper: "H556/01", year: 2024, section: "B", number: "17", question: "Aircraft in wind tunnel: Newton's second law, airflow forces and lift", marks: 8, specCodes: ["3.2.1", "3.2.2"] },
  { paper: "H556/01", year: 2024, section: "B", number: "18", question: "Rubber cord: loading/unloading curves, Hooke's law, hysteresis and energy", marks: 10, specCodes: ["3.4.2", "3.4.3"] },
  { paper: "H556/01", year: 2024, section: "B", number: "19*", question: "Determine laser wavelength using a diffraction grating: method and accuracy", marks: 6, specCodes: ["4.2.5", "2.1.2"] },
  { paper: "H556/01", year: 2024, section: "B", number: "20", question: "Ideal gas: internal energy, rms speed, Boltzmann, molar mass, filament lamp pressure", marks: 12, specCodes: ["5.1.2", "5.1.1"] },

  // ===== June 2024 Paper 2 (H556/02) =====
  { paper: "H556/02", year: 2024, section: "A", number: "1", question: "Base units of a kilowatt-hour", marks: 1, specCodes: ["2.1.1"] },
  { paper: "H556/02", year: 2024, section: "A", number: "2", question: "Neutrino classification and force felt", marks: 1, specCodes: ["6.6.1"] },
  { paper: "H556/02", year: 2024, section: "A", number: "3", question: "Which non-invasive scan does not expose patient to ionising radiation?", marks: 1, specCodes: ["6.5.1", "6.5.2", "6.5.3"] },
  { paper: "H556/02", year: 2024, section: "A", number: "4", question: "Three capacitors: total capacitance between X and Y", marks: 1, specCodes: ["6.1.1"] },
  { paper: "H556/02", year: 2024, section: "A", number: "5", question: "Micrometer with zero error: correct cross-sectional area of wire", marks: 1, specCodes: ["2.1.2"] },
  { paper: "H556/02", year: 2024, section: "A", number: "6", question: "Oscilloscope display: amplitude and frequency of alternating voltage", marks: 1, specCodes: ["4.1.1"] },
  { paper: "H556/02", year: 2024, section: "A", number: "7", question: "Rate of radioactive decay: which statements are true?", marks: 1, specCodes: ["6.4.1"] },
  { paper: "H556/02", year: 2024, section: "A", number: "8", question: "Capacitor discharge spreadsheet model: charge at t=1.5s", marks: 1, specCodes: ["6.1.2"] },
  { paper: "H556/02", year: 2024, section: "A", number: "9", question: "Phase difference between two points on a stationary wave", marks: 1, specCodes: ["4.2.4"] },
  { paper: "H556/02", year: 2024, section: "A", number: "10", question: "V-I graph: determining emf and internal resistance", marks: 1, specCodes: ["4.1.3"] },
  { paper: "H556/02", year: 2024, section: "A", number: "11", question: "Force on electron in Earth's magnetic field at equator", marks: 1, specCodes: ["6.3.2"] },
  { paper: "H556/02", year: 2024, section: "A", number: "12", question: "Radius of a carbon nucleus with 6 protons and 7 neutrons", marks: 1, specCodes: ["6.4.3"] },
  { paper: "H556/02", year: 2024, section: "A", number: "13", question: "Which sub-atomic particle has a positive charge?", marks: 1, specCodes: ["6.6.1"] },
  { paper: "H556/02", year: 2024, section: "A", number: "14", question: "Three cells in circuit: ammeter reading with 1kΩ resistor", marks: 1, specCodes: ["4.1.3"] },
  { paper: "H556/02", year: 2024, section: "A", number: "15", question: "Ordering energies: electron in 1V, proton at 1000 m/s, X-ray photon", marks: 1, specCodes: ["4.4.1", "3.3.1"] },
  { paper: "H556/02", year: 2024, section: "B", number: "16", question: "Thermistor investigation: circuit correction, data plotting, NTC/PTC and potential divider", marks: 9, specCodes: ["4.1.2", "4.1.3"] },
  { paper: "H556/02", year: 2024, section: "B", number: "17", question: "Two-source interference: constructive/destructive, frequency calculation, intensity", marks: 11, specCodes: ["4.2.3"] },
  { paper: "H556/02", year: 2024, section: "B", number: "18*", question: "Transformer experiment: method, data analysis, laminated core and eddy currents", marks: 12, specCodes: ["6.3.1", "2.1.2"] },
  { paper: "H556/02", year: 2024, section: "B", number: "19", question: "Lightning: spherical capacitor model, charge, potential, current of electrons", marks: 11, specCodes: ["6.1.1", "6.2.1", "6.2.2"] },
  { paper: "H556/02", year: 2024, section: "B", number: "20", question: "Radioactive decay: decay constant, half-life, activity, background, experimental method", marks: 13, specCodes: ["6.4.1"] },
  { paper: "H556/02", year: 2024, section: "B", number: "21", question: "Photoelectric effect: work function, threshold frequency, and X-ray in body", marks: 7, specCodes: ["4.4.1", "6.5.1"] },

  // ===== June 2024 Paper 3 (H556/03) =====
  { paper: "H556/03", year: 2024, section: "B", number: "1", question: "Flute standing waves: length calculation, speed of sound in helium, kinetic model assumptions", marks: 9, specCodes: ["4.2.4", "5.1.2"] },
  { paper: "H556/03", year: 2024, section: "B", number: "2", question: "RC circuit investigation: T = ln2 × N²RC, precision, graph plotting and uncertainty", marks: 15, specCodes: ["6.1.2", "2.1.2"] },
  { paper: "H556/03", year: 2024, section: "B", number: "3", question: "Rocket launch: Newton's laws, projectile to maximum height, evaluation of constant g", marks: 9, specCodes: ["3.2.1", "3.1.2", "5.3.1"] },
  { paper: "H556/03", year: 2024, section: "B", number: "4", question: "Spring and mass: force constant, SHM frequency, electromagnetic induction with coil", marks: 12, specCodes: ["3.4.2", "5.2.2", "6.3.1"] },
  { paper: "H556/03", year: 2024, section: "B", number: "5", question: "Cell emf and internal resistance: I-V characteristic, thermistor experiment design", marks: 11, specCodes: ["4.1.3", "2.1.2"] },
  { paper: "H556/03", year: 2024, section: "B", number: "6", question: "Proton in electric and magnetic fields: forces, circular motion radius, resultant force", marks: 10, specCodes: ["6.2.1", "6.3.2"] },
];
