
async function testApi() {
    const baseUrl = 'https://s16-backend-production.up.railway.app/api/v1';

    try {
        console.log('Fetching eventos...');
        const resEvents = await fetch(`${baseUrl}/eventos/`);
        const events = await resEvents.json();
        console.log(`Eventos count: ${events.length}`);

        console.log('\nFetching partidos...');
        const resMatches = await fetch(`${baseUrl}/partidos/`);
        const matches = await resMatches.json();
        console.log(`Partidos count: ${matches.length}`);

        console.log('\nFetching rivales...');
        const resRivals = await fetch(`${baseUrl}/rivales/`);
        const rivals = await resRivals.json();
        console.log(`Rivales count: ${rivals.length}`);

        console.log('\nChecking linking...');
        let linkedMatches = 0;
        for (const m of matches) {
            const event = events.find(e => String(e.id) === String(m.Evento));
            const rival = rivals.find(r => String(r.id_equipo) === String(m.Rival));

            if (event && rival) {
                linkedMatches++;
            } else {
                console.log(`Match ${m.id} missing: ${event ? '' : 'Evento '}${rival ? '' : 'Rival'}`);
                if (!event) console.log(`  Expected Evento ID: ${m.Evento}`);
                if (!rival) console.log(`  Expected Rival ID: ${m.Rival}`);
            }
        }
        console.log(`Linked matches: ${linkedMatches}/${matches.length}`);

        if (events.length > 0) {
            console.log('\nFirst event types:');
            const types = [...new Set(events.map(e => e.tipo))];
            console.log(types);
        }

    } catch (error) {
        console.error('Error fetching from API:', error);
    }
}

testApi();
