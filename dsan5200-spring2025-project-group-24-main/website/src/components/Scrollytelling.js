// src/components/Scrollytelling.js
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { motion } from 'framer-motion';
import * as d3 from 'd3';


import NarrativeContainer from './NarrativeContainer';
import Timeline from './visualizations/Timeline';
import RegionMap from './visualizations/RegionMap';
import TimelineSection from './visualizations/TimelineSection';
import TacticalTimeline from './visualizations/TacticalTimeline';
import TimelineToggles from './ui/TimelineToggles'; // optional if handled inside TacticalTimeline
import RadialCalendar from './visualizations/RadialCalendar';
import TopCountriesBarChart from './visualizations/TopCountriesBarChart';
import TacticalOverlayMap from './visualizations/TacticalOverlayMap';
import IncidentSidebar from './ui/IncidentSidebar';
import LayerToggles from './ui/LayerToggles';
import useOverlayData from '../hooks/useOverlayData'; // adjust path as needed
import IncidentFilterPanel from './visualizations/IncidentFilterPanel';
import Footer from './layout/Footer';
import getDataPath from '../utils/getDataPath'; // or '../utils/getDataPath' if needed
import ImageGalleryRow from './ImageGalleryRow'; // adjust path as needed

// Define motion variants for a gradual fade-in and slide-up animation
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: 'easeInOut'
    }
  }
};

const Scrollytelling = ({ data, filters, setFilters }) => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [overlayLayers, setOverlayLayers] = useState({
    offensives: true,
    settlements: false,
    attacks: true,
  });

  const { cities } = useOverlayData();
  const [radialData, setRadialData] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: null,
    endDate: null
  });

  // Consolidated week selection handler that handles both UI state and filtering
  const handleWeekSelection = useCallback((weekStart, weekEnd) => {
    if (!weekStart || !weekEnd) {
      // Handle clearing the selection
      setSelectedDateRange({
        startDate: null,
        endDate: null
      });
      
      // Clear date range filter but keep other filters intact
      setFilters(prev => ({
        ...prev,
        dateRange: []
      }));
      return;
    }
    
    if (!(weekStart instanceof Date) || isNaN(weekStart) ||
        !(weekEnd instanceof Date) || isNaN(weekEnd)) {
      console.warn('Invalid date range:', weekStart, weekEnd);
      return;
    }
  
    // Update selected date range for UI display
    setSelectedDateRange({
      startDate: weekStart,
      endDate: weekEnd
    });
    
    // Update filters for data filtering
    setFilters(prev => ({
      ...prev,
      year: [],
      motive: [],
      type: [],
      actor: [],
      dateRange: [weekStart.toISOString(), weekEnd.toISOString()]
    }));
  }, [setFilters]);

  useEffect(() => {
    d3.csv(getDataPath('data/security_incidents_with_day.csv'), d => {
      const year = +d.year;
      const month = +d.month;
      const day = +d.day;
  
      // Construct date only if all parts are present
      if (!year || !month || !day) return null;
  
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate)) return null;
  
      return {
        date: dateStr,
        year: year,
        summary: d.details || 'No summary',
        actor: d.actor_type || 'Unknown',
        severity: +d.total_affected || 0,
        motive: d.motive || 'Unknown',
      };
    }).then(rows => {
      const filtered = rows.filter(Boolean);
      console.log('✅ Parsed radialData:', filtered);
      setRadialData(filtered);
    });
  }, []);
  

  const yearOptions = [...new Set(data.map(d => +d['Year']))].sort();
  const motiveOptions = [...new Set(data.map(d => d['Motive']))].sort();
  const typeOptions = [...new Set(data.map(d => d['Means of attack']))].filter(Boolean);
  const actorOptions = [...new Set(data.map(d => d['Actor type']))].filter(Boolean);

  const resetFilters = () => {
    setFilters({
      year: [],
      motive: [],
      type: [],
      actor: [],
      dateRange: []
    });
    setSelectedIncident(null);
    setSelectedDateRange({
      startDate: null,
      endDate: null
    });
  
    // Add this line — key fix:
    document.dispatchEvent(new CustomEvent('clear-region-selection'));
  };
  
  // Function to handle filter changes
  return (
    <>
      {/* Section 1: Introduction */}
      <motion.section
        id="introduction"
        style={{ scrollSnapAlign: 'start', marginBottom: '2rem' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
        <Typography
            variant="h2"
            gutterBottom
            align="center"
            sx={{ pt: 3, mb: 4 }} // Adds extra space above the h3
          >
            NAVIGATING TURBULENCE: HUMANITARIAN SECURITY INCIDENTS, 1997–2024
          </Typography>
          <Typography
            variant="h4"
            gutterBottom
            align="left"
            sx={{ mb: 1, pt: 4 }} // Adds a bit of space between h4 and the paragraphs
          >
            INTRODUCTION
          </Typography>
          <Typography variant="body1" paragraph>
            Between 1997 and 2024, there have been at least{' '}
            <strong>4,337 recorded security incidents</strong> involving humanitarian
            workers across more than <strong>80 countries</strong>. These events—
            ranging from isolated assaults on aid personnel to larger, coordinated
            attacks—underscore the precarious conditions in which many humanitarian
            operations take place. Over time, both the <strong>number</strong> of
            incidents and the <strong>severity</strong> of violence have risen,
            reflecting not only intensifying conflicts but also improved data
            collection efforts among NGOs and international agencies.
          </Typography>
          <Typography variant="body1" paragraph>
            In preparing this investigation, we worked with a dataset of 41 columns
            describing each incident—capturing dates, locations, possible motives,
            casualty counts, and more. Missing information was standardized rather
            than discarded, preserving partial records to examine broader patterns,
            such as correlations with local or religious holidays.
          </Typography>
          <Typography
            variant="h3"
            align="center"
            gutterBottom sx={{ fontWeight: 'bold', pt: 3, mb:2, color: 'primary' }}
          >
            4,337 TOTAL INCIDENTS
          </Typography>
        </NarrativeContainer>
        <ImageGalleryRow />
      </motion.section>

      {/* Section 2: Steady Escalation Over Time */}
      <motion.section
        id="timelineNarrative"
        style={{ scrollSnapAlign: 'start' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.15 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
          <Typography variant="h4" gutterBottom sx={{ mt: 0, mb: 2 }}>
            A STEADY ESCALATION OVER TIME
          </Typography>

          <Typography variant="body1" paragraph sx = {{ mb: 4 }}>
            Humanitarian workers have faced a steadily worsening security environment since 1997.
            In the late '90s, only a handful of incidents were recorded each year — but that number
            surged dramatically by the early 2010s and remained high throughout the next decade.
            This is not simply a matter of better reporting: the rise aligns with deepening conflicts,
            protracted crises, and the growing visibility of international aid actors in volatile regions.
          </Typography>

          <Box sx={{ width: '100%', my: 4 }}>
            <Timeline data={data} />
          </Box>
          <Typography variant="body1" paragraph>
            Two notable spikes stand out: one in <strong>2013</strong>, coinciding with heightened
            violence in <strong>Syria</strong> and <strong>South Sudan</strong>, and another beginning
            in <strong>2018</strong>, as instability spread across <strong>Sahel countries</strong> and parts
            of <strong>the Horn of Africa</strong>. Meanwhile, the apparent dip in <strong>2024</strong> is likely
            due to reporting lags, especially from NGOs in remote or insecure areas.
          </Typography>

          <Typography variant="body1" paragraph>
            When filtering the timeline by event type or actor category, new patterns emerge. For example,
            incidents involving <strong>foreign military presence</strong> cluster during sharp escalations,
            often resulting in both <strong>civilian and humanitarian casualties</strong>. Shock events—those
            with high fatality counts—frequently precede follow-on incidents, suggesting potential cycles
            of retaliation or instability ripple effects.
          </Typography>

          <Typography variant="body1" paragraph>
            This timeline isn't just a count of attacks — it's a signal. It shows how humanitarian space
            has narrowed over time, shaped by shifting geopolitics, tactical violence, and a climate of impunity.
            For aid agencies, it underscores the need for <strong>anticipatory security planning</strong>,
            not just reactive risk management.
          </Typography>
        </NarrativeContainer>

        <Box sx={{ width: '100%', my: 2 }}>
          <TimelineSection />
        </Box>
      </motion.section>

    {/* Section 3: Geographic Hotspots */}
    <motion.section
      id="globalHotspots"
      style={{ scrollSnapAlign: 'start' }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: 0.15 }}
      variants={sectionVariants}
    >
      <NarrativeContainer>
        <Typography variant="h4" align="left" gutterBottom sx={{ mt: 0, mb: 2 }}>
          GEOGRAPHIC HOTSPOTS
        </Typography>
        <Typography variant="body1" paragraph>
          A small cluster of countries bears the brunt of humanitarian security incidents — not just in numbers, but in frequency, 
          severity, and symbolic weight. From 1997 to 2024, over half of all recorded attacks occurred in just <strong>six countries</strong>: 
          <strong>Afghanistan</strong>, <strong>South Sudan</strong>, <strong>Sudan</strong>, <strong>Somalia</strong>, <strong>Syria</strong>, 
          and the <strong>Democratic Republic of the Congo</strong>. These are not just crisis zones — they are prolonged theaters of violence 
          where aid work intersects with political fragmentation, militarized governance, and persistent insecurity.
        </Typography>

        <Typography variant="body1" paragraph>
          The map visualization reveals how these incidents are not randomly distributed — they <strong>concentrate along conflict corridors</strong>,
          such as eastern DR Congo's Kivu region, the <strong>Kabul–Jalalabad corridor</strong> in Afghanistan, and <strong>border areas of 
          South Sudan and Sudan</strong>, where displacement, militarization, and aid presence collide.
        </Typography>

        <Typography variant="body1" paragraph>
          Some of these locations have witnessed <strong>high-profile attacks</strong> that reshaped humanitarian strategy. In <strong>2013</strong>, 
          a Taliban ambush along the Kabul–Jalalabad Road killed five security personnel escorting a UN convoy — a stark reminder of the risks aid workers 
          face even under protection. In <strong>2023</strong>, Israeli airstrikes hit UN-run schools in <strong>Gaza</strong> being used as civilian shelters, 
          killing both civilians and UN staff and drawing international condemnation. And in <strong>2022</strong>, protesters in <strong>eastern DRC</strong> 
          stormed a MONUSCO base after UN peacekeepers opened fire, killing several — reflecting not only external threats but <strong>hostility from local 
          populations</strong> as well.
        </Typography>

        <Typography variant="body1" paragraph>
          Not every hotspot looks the same. In <strong>Somalia</strong>, the dominant threat comes from <strong>non-state actors</strong> 
          like al-Shabaab targeting aid convoys. In <strong>South Sudan</strong>, patterns of violence often reflect <strong>interethnic clashes</strong> 
          and spillover from political fragmentation. In <strong>Syria</strong>, attacks near frontlines often coincide with military campaigns and shifts in territorial control.
        </Typography>

        <Typography variant="body1" paragraph>
          This geographic concentration highlights both operational fragility and systemic targeting. Humanitarian organizations cannot afford to treat these 
          incidents as isolated — they are part of broader patterns of <strong>localized hostility</strong>, <strong>political intimidation</strong>, and, at times, 
          <strong>deliberate obstruction of aid</strong>.
        </Typography>
      </NarrativeContainer>

        {/* Filter Panel before the geographic section */}
        <Box px={2} pt={2}>
            <IncidentFilterPanel
              filters={filters}
              setFilters={setFilters}
              yearOptions={yearOptions}
              motiveOptions={motiveOptions}
              typeOptions={typeOptions}
              actorOptions={actorOptions}
            />
        </Box>
        <Box sx={{ width: '100%', my: 2 }}>
          <RegionMap
            data={data}
            filters={filters}
            setSelectedIncident={setSelectedIncident}  // Ensuring the incident can be selected
            clearSelectedIncident={() => setSelectedIncident(null)}  // Clear the selected incident
          />
        </Box>
        <Box sx={{ mt: 2 }}>
            <Button variant="outlined" size="small" color="primary" onClick={resetFilters}>
              Clear Filters
            </Button>
        </Box>
      </motion.section>

      {/* Section 4: Actors & Motives */}
      <motion.section
        id="actorsMotives"
        style={{ scrollSnapAlign: 'start' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.15 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
          <Typography variant="h4" gutterBottom sx={{ mt: 0, mb: 2 }}>
            ACTORS & MOTIVES: WHO IS RESPONSIBLE — AND WHY?
          </Typography>

          <Typography variant="body1" paragraph>
            Understanding who targets humanitarian workers — and why — is fundamental to managing
            security in complex emergencies. While a significant portion of incidents remain attributed
            to <strong>"unknown" actors</strong>, the majority of identified perpetrators fall into the category
            of <strong>non-state armed groups</strong>, often operating at local or regional levels. These include rebel
            militias, criminal networks, and ideological factions whose goals vary from territorial control
            to political messaging.
          </Typography>

          <Typography variant="body1" paragraph>
            Where motives are identified, the most common are <strong>political</strong>, <strong>incidental</strong>,
            and <strong>economic</strong>:
            <br />– <strong>Political attacks</strong> often target the <em>symbolism</em> of foreign aid — viewed
            by some as a proxy for Western influence or government alignment.
            <br />– <strong>Incidental violence</strong> typically arises from crossfire or local unrest, placing
            aid workers in harm's way simply by proximity.
            <br />– <strong>Economic motives</strong>, such as <em>ransom kidnappings</em> or <em>resource looting</em>,
            are especially prevalent in contexts with weak institutions and organized banditry.
          </Typography>

          <Typography variant="body1" paragraph>
            For example, <strong>South Sudan</strong> exhibits a high frequency of incidental violence, often connected
            to communal clashes and unstable ceasefires. In contrast, <strong>Somalia</strong> presents a pattern
            of politically motivated attacks by <strong>al-Shabaab</strong>, aimed at undermining international presence.
            Meanwhile, in <strong>Mali</strong> and parts of the <strong>Sahel</strong>, ransom kidnappings have become
            a strategic tool for financing insurgency operations.
          </Typography>

          <Typography variant="body1" paragraph>
            Importantly, the prevalence of <strong>"unknown"</strong> actors reflects the blurred lines in many modern
            conflicts. Poor visibility, misinformation, or lack of investigation often leave victims and responders
            with no clear answers — a reality that complicates accountability and response.
          </Typography>
          <Typography variant="body1" paragraph>
            By visualizing this data in hierarchical form, we reveal not just the actors themselves, but how
            <strong> motive and identity intertwine</strong> — and where knowledge gaps persist. It's a map of visibility,
            but also of <strong>murkiness and strategic ambiguity</strong> — where power often operates in the shadows.
          </Typography> 
          <Paper
            elevation={2}
            sx={{ 
              p: 2, 
              mt: 3, 
              mb: 2, 
              backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
              borderLeft: theme => `6px solid ${theme.palette.primary.main}`,
              color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'inherit'
            }}
          >
            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
              "<strong>Political motives dominate</strong> where they are known, but many incidents remain
              'unknown,' reflecting the <strong>murkiness of modern conflicts</strong>."
            </Typography>
          </Paper>
        </NarrativeContainer>
      </motion.section>

      {/* Section 4.5: Strategic Overlays */}
      <motion.section
        id="strategicOverlay"
        style={{ scrollSnapAlign: 'start' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.15 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
          <Typography variant="h4" gutterBottom align="left" sx={{ mb: 2, mt: 0 }}>
            STRATEGIC OVERLAYS: WHERE TARGETING INTERSECTS AID ZONES
          </Typography>
          <Typography variant="body1" paragraph>
            Violence against humanitarian operations doesn't occur in a vacuum — it often reflects
            the broader geography of conflict. When we layer <strong>incident data</strong> over
            <strong>military offensives</strong> and <strong>civilian settlements</strong>, a troubling pattern emerges:
            aid workers are frequently caught in the same strategic spaces where armed actors
            compete for control, and where vulnerable populations concentrate.
          </Typography>

          <Typography variant="body1" paragraph>
            For example, in the eastern provinces of the <strong>Democratic Republic of the Congo</strong>,
            aid incidents often coincide with zones of active military deployment and dense civilian
            displacement. In <strong>Gaza</strong>, several incidents occurred within or near UN shelters,
            highlighting the blurred lines between civilian infrastructure and combat zones. And in
            <strong>Sudan</strong> and <strong>South Sudan</strong>, incidents frequently overlap with humanitarian corridors
            near contested border zones.
          </Typography>

          <Typography variant="body1" paragraph>
            This spatial overlay allows us to see intentional or collateral targeting in motion.
            When humanitarian spaces become entangled with military objectives — either through
            proximity or strategy — the risk to aid personnel multiplies. These maps aren't just
            visualizations; they are tools for identifying <strong>risk zones</strong>, planning safer missions,
            and understanding how war reshapes the humanitarian landscape.
          </Typography>
        

        {/* Map toggle controls */}
        <Box sx={{ px: 4, mt: 2, mb: 2 }}>
          <LayerToggles
            showMilitary={overlayLayers.offensives}
            showSettlements={overlayLayers.settlements}
            showIncidents={overlayLayers.attacks}
            onToggle={(key) =>
              setOverlayLayers(prev => ({ ...prev, [key]: !prev[key] }))
            }
          />
        </Box>

        {/* Map itself */}
        <Box sx={{ width: '100%', mt: 8}}>
          <TacticalOverlayMap
            layers={overlayLayers}
            cities={cities}
            setSelectedIncident={setSelectedIncident}  // Ensuring the incident can be selected
            clearSelectedIncident={() => setSelectedIncident(null)}  // Clear the selected incident
          />
        </Box>
        </NarrativeContainer>
        <NarrativeContainer>
        <Typography variant="body1" paragraph>
            While the map paints a stark portrait of fixed conflict zones, the unfolding chronology of 
            incidents adds another layer to the narrative. As events cascade with measurable regularity, 
            recurring patterns hint at both calculated tactics and the inherent unpredictability of crisis situations. 
            In this interplay of location and time, the rhythm of unfolding events reveals nuances that deepen 
            our understanding of the forces shaping these conflict zones.
          </Typography>
          </NarrativeContainer>
      </motion.section>
      
      {/* Section 4.6: Tactical & Symbolic Timing */}
      <motion.section
        id="tacticalTiming"
        style={{ scrollSnapAlign: 'start' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.15 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
          <Typography
            variant="h4"
            gutterBottom
            align="left"
            sx={{ mb: 2, mt: 0}}
          >
            TACTICAL & SYMBOLIC TIMING
          </Typography>
          <Typography variant="body1" paragraph>
            Timing is rarely neutral in conflict. By plotting security incidents week by week,
            patterns emerge that suggest not only seasonal rhythms, but <strong>intentional timing</strong>.
            Sudden spikes often correspond to <strong>military campaigns</strong>, political flashpoints,
            or symbolic dates that carry social or religious significance.
          </Typography>

          <Typography variant="body1" paragraph>
            In some regions, high-severity incidents act as flashpoints — triggering follow-up
            violence or destabilization in surrounding weeks. These aftershocks may stem from
            retaliation, panic, or power struggles exacerbated by initial attacks. Being able
            to identify these <strong>shock-response cycles</strong> is critical for anticipatory action.
          </Typography>

          <Typography variant="body1" paragraph>
            The timeline tool lets users explore this volatility by toggling overlays for
            <strong>casualties</strong>, <strong>holidays</strong>, and <strong>statistically significant spikes</strong>.
            Clicking on a given week reveals not just what happened — but when, and in what
            context. This makes it easier to spot patterns of <em>strategic escalation</em> or
            <em>holiday-aligned messaging</em> by armed actors.
          </Typography>
        </NarrativeContainer>

        <Box px={4} sx={{ mt: 2 }}>
          <TacticalTimeline onWeekClick={handleWeekSelection} />
        </Box>
      </motion.section>

      {/* Section 5: Holidays, Seasonality & Severity */}
      <motion.section
        id="timing-and-severity"
        style={{ scrollSnapAlign: 'start' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.15 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
          <Typography
            variant="h4"
            gutterBottom
            align="left"
            sx={{ mb: 2, mt: 0 }}
          >
            TEMPORAL PATTERNS & SEVERITY
          </Typography>
          <Typography variant="body1" paragraph>
            While global data shows no overwhelming surge in attacks during holidays,
            a closer look reveals that <strong>symbolic timing</strong> does matter in certain contexts.
            In <strong>Afghanistan</strong>, for instance, there is a recurring pattern of incidents
            coinciding with <strong>Eid</strong> — a time of heightened visibility and movement,
            which may be exploited by hostile actors for either ideological impact or tactical gain.
          </Typography>

          <Typography variant="body1" paragraph>
            To better understand impact, we developed a <strong>severity index</strong>:
            assigning 3 points for each death, 2 per injury, and 1 per kidnapping.
            This allows us to distinguish everyday threats from <strong>shock events</strong> —
            high-casualty incidents that often dominate headlines and trigger operational standstills.
          </Typography>

          <Typography variant="body1" paragraph>
            When we apply a ±30-day window around these shock events, we see evidence of
            <strong>secondary waves of violence</strong>. In some cases, this may reflect retaliation.
            In others, it may signal destabilization rippling outward from a major incident.
            These ripple effects suggest that time — like geography or actor type —
            can be a <em>predictive risk layer</em>.
          </Typography>

          <Typography variant="body1" paragraph>
            Visualized across multiple years, the calendar view helps spotlight recurring
            periods of instability. It invites us to ask: when are humanitarian workers
            most vulnerable — and what timing patterns are being strategically exploited?
          </Typography>
        </NarrativeContainer>
        <Box sx={{ width: '100%', my: 2 }}>
          <RadialCalendar data={radialData} years={[2020, 2021, 2022, 2023]} />
        </Box>
      </motion.section>

      {/* Section 6: The Human Toll */}
      <motion.section
        id="humanToll"
        style={{ scrollSnapAlign: 'start' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.15 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
          <Typography
              variant="h4"
              gutterBottom
              align="left"
              sx={{ mb: 2, mt: 0}} // Adds a bit of space between h4 and the paragraphs
            >
            THE HUMAN TOLL: KILLED, WOUNDED, AND KIDNAPPED
          </Typography>
          <Typography variant="body1" paragraph>
            Behind every data point is a life interrupted. This section moves beyond incident counts
            to focus on the <strong>human cost</strong> of violence against humanitarian workers.
            The data shows over <strong>1,200 fatalities</strong>, thousands wounded, and hundreds kidnapped
            between 1997 and 2024 — each one a direct hit to humanitarian capacity and morale.
          </Typography>

          <Typography variant="body1" paragraph>
            The top 10 countries by incident impact tell a layered story. <strong>Afghanistan</strong>
            accounts for the most <strong>fatalities</strong>, driven by both targeted ambushes and roadside
            bombings. <strong>South Sudan</strong> and the <strong>Central African Republic</strong> see high rates of
            <strong>wounded</strong> aid workers, often caught in communal crossfire. Meanwhile, places like
            <strong>Mali</strong> and the <strong>Sahel region</strong> rank disproportionately high in <strong>kidnappings</strong> —
            a tactic used not only for ransom, but to send messages or gain leverage.
          </Typography>

          <Typography variant="body1" paragraph>
            These differences matter. Kidnappings may force evacuations or diplomatic interventions,
            while mass-casualty attacks can paralyze aid operations for weeks or months.
            Understanding where — and how — these outcomes occur helps humanitarian agencies
            allocate protective resources and develop targeted response protocols.
          </Typography>

          <Typography variant="body1" paragraph>
            This chart lets you filter by <strong>type of harm</strong> and compare across countries,
            surfacing both predictable hotspots and surprising outliers. For instance,
            the <strong>occupied Palestinian territories</strong> appear mid-ranked overall, but have a
            particularly high proportion of injuries relative to incident count — raising questions
            about intensity, environment, and operational proximity to violence.
          </Typography>
          </NarrativeContainer>
            <Box sx={{ width: '100%', my: 1 }}>
              <TopCountriesBarChart data={data} />
            </Box>
      </motion.section>
       
      {/* Section 7: Conclusion & Recommendations */}
      <motion.section
        id="conclusion"
        style={{ scrollSnapAlign: 'start' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.15 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
          <Typography
              variant="h4"
              gutterBottom
              align="left"
              sx={{ mb: 0, mt: 0 }} // Adds a bit of space between h4 and the paragraphs
            >
            CONCLUSION AND RECOMMENDATIONS
          </Typography>
          <Typography variant="body1" paragraph>
            This investigation reveals a landscape of <strong>persistent risk</strong> and
            <strong>evolving threats</strong> for humanitarian operations worldwide. From
            frontline fatalities in Afghanistan to ransom kidnappings in the Sahel,
            the data shows that violence is not random — it is often <em>targeted,
            patterned, and strategic</em>.
          </Typography>
          <Typography variant="body1" paragraph>
            A few countries bear the brunt, but the challenge is global. Patterns of
            escalation around holidays, ripple effects from high-severity attacks, and
            the strategic positioning of aid operations in contested zones all highlight
            the need for <strong>anticipatory security planning</strong>.
          </Typography>
          <Typography variant="body1" paragraph>
            While non-state armed groups dominate the known actor landscape,
            the prevalence of "unknown" perpetrators reminds us how much remains
            hidden — and how easily visibility breaks down in the fog of war.
            Better incident reporting, forensic tracking, and protection protocols are
            essential to closing these gaps.
          </Typography>
          <Typography variant="body1" paragraph>
            We recommend that humanitarian agencies invest in:
            <br />– Robust <strong>threat detection</strong> tools tied to symbolic calendars and event forecasting
            <br />– Enhanced <strong>local partnerships</strong> to improve early warning and community trust
            <br />– Region-specific <strong>kidnap mitigation strategies</strong> and staff training
          </Typography>
          <Typography variant="body1" paragraph>
            Finally, humanitarian security must be understood as <em>integral to the
            mission</em> — not separate from it. Aid cannot be delivered where safety
            is compromised. Protecting those who serve is essential to protecting
            those in need.
          </Typography>
        </NarrativeContainer>
      </motion.section>

      {/* Section 8: Acknowledgments & Data Handling */}
      <motion.section
        id="acknowledgments"
        style={{ scrollSnapAlign: 'start' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.15 }}
        variants={sectionVariants}
      >
        <NarrativeContainer>
          <Typography
            variant="h4"
            gutterBottom
            align="left"
            sx={{ mb: 0, mt: 0 }}
          >
            ACKNOWLEDGMENTS AND DATA HANDLING
          </Typography>

          <Typography variant="body1" paragraph>
            This project draws upon over two decades of global incident data,
            compiled from humanitarian security logs, conflict monitoring networks,
            and open-source records. The core dataset includes 4,337 incidents from 1997 to 2024,
            each standardized across <strong>41 variables</strong> — including location, actor type,
            means of attack, motive, and casualty counts. The file is publicly available and can be
            downloaded <a href="/data/security_incidents.csv" target="_blank" rel="noopener noreferrer"><strong>here</strong></a>.
          </Typography>

          <Typography variant="body1" paragraph>
            To enhance the range and analytical depth of this data, we cross-referenced additional sources,
            including:
            <ul>
              <li>
                ACLED's <a href="https://acleddata.com/conflict-exposure/" target="_blank" rel="noopener noreferrer">
                Conflict Exposure datasets</a> for regional context and conflict classification
              </li>
              <li>
                The <a href="https://hub.worldpop.org/doi/10.5258/SOTON/WP00693" target="_blank" rel="noopener noreferrer">
                WorldPop</a> and <a href="https://human-settlement.emergency.copernicus.eu/ghs_stat_ucdb2015mt_r2019a.php?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer">
                Copernicus GHS settlement grids</a> to assess proximity of incidents to civilian population centers
              </li>
              <li>
                Key media investigations to validate high-impact cases:
                <ul>
                  <li>
                    <a href="https://www.hindustantimes.com/world-news/five-security-personnel-killed-in-attack-on-un-convoy-in-afganistan-101615703971998.html" target="_blank" rel="noopener noreferrer">
                    UN convoy ambush in Afghanistan (2013)</a>
                  </li>
                  <li>
                    <a href="https://www.france24.com/en/africa/20220731-several-killed-after-un-peacekeepers-open-fire-in-eastern-dr-congo" target="_blank" rel="noopener noreferrer">
                    MONUSCO protest killings in eastern DRC (2022)</a>
                  </li>
                  <li>
                    <a href="https://www.aljazeera.com/features/2023/10/10/why-bomb-schools-gaza-families-have-no-safe-space-amid-israeli-attacks" target="_blank" rel="noopener noreferrer">
                    UN shelter strikes in Gaza (2023)</a>
                  </li>
                </ul>
              </li>
            </ul>
          </Typography>

          <Typography variant="body1" paragraph>
            Missing values were preserved using standardized labels like <em>"Unknown"</em> to maintain completeness
            for temporal, spatial, and motive-based analysis. For comparative severity, we constructed a
            <strong>severity index</strong> (3 points per fatality, 2 per injury, 1 per kidnapping) to distinguish
            high-impact events from lower-risk encounters.
          </Typography>

          <Typography variant="body1" paragraph>
            Together, these sources allowed us to not only visualize patterns — but to ask deeper questions:
            <em>When is violence symbolic? Where are aid workers most exposed? Who is behind these attacks,
            and how can this risk be anticipated?</em> This project aims to help answer those questions through data.
          </Typography>

          <Typography variant="body1" paragraph>
            For those interested in diving deeper, our full methodology and exploratory analysis are available:
            <br />
            – View the full <a href="/scholarship-eda.html" target="_blank" rel="noopener noreferrer"><strong>EDA report & methodology walkthrough</strong></a>
            <br />
            – Browse the complete <a href="/gallerygrid" target="_blank" rel="noopener noreferrer"><strong>visualization gallery</strong></a>
          </Typography>
        </NarrativeContainer>
      </motion.section>

      
      {/* Incident Sidebar — always rendered, only visible if incident is selected */}
      {selectedIncident && (
        <IncidentSidebar
          incident={selectedIncident}  // Passed down from state
          onClose={() => setSelectedIncident(null)}  // Close the sidebar
        />
      )}
    </>
  );
};

export default Scrollytelling;