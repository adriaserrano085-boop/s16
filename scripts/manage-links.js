
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log("--- Player Link Manager ---");

    // 1. List current links
    const { data: players, error } = await supabase
        .from('jugadores_propios')
        .select('id, nombre, apellidos, Usuario')
        .order('nombre');

    if (error) {
        console.error("Error fetching players:", error);
        process.exit(1);
    }

    console.log(`\nFound ${players.length} players.`);
    const linked = players.filter(p => p.Usuario);
    console.log(`Currently Linked Players (${linked.length}):`);
    linked.forEach(p => console.log(`- ${p.nombre} ${p.apellidos} [ID: ${p.id}] -> User: ${p.Usuario}`));

    console.log("\nOptions:");
    console.log("1. Link a User ID to a Player");
    console.log("2. Unlink a Player");
    console.log("3. Exit");

    rl.question("\nSelect option (1-3): ", async (choice) => {
        if (choice === '1') {
            await linkUser(players);
        } else if (choice === '2') {
            await unlinkUser(linked);
        } else {
            console.log("Exiting.");
            process.exit(0);
        }
    });
}

async function linkUser(players) {
    rl.question("\nEnter part of Player Name to search: ", (namePart) => {
        const matches = players.filter(p =>
            p.nombre.toLowerCase().includes(namePart.toLowerCase()) ||
            p.apellidos?.toLowerCase().includes(namePart.toLowerCase())
        );

        if (matches.length === 0) {
            console.log("No players found.");
            process.exit(0);
        }

        console.log("\nMatches:");
        matches.forEach((p, i) => console.log(`${i + 1}. ${p.nombre} ${p.apellidos} (Current User: ${p.Usuario || 'None'})`));

        rl.question("\nSelect player number: ", (num) => {
            const index = parseInt(num) - 1;
            if (index >= 0 && index < matches.length) {
                const selectedPlayer = matches[index];
                rl.question(`\nEnter User UUID to link to ${selectedPlayer.nombre}: `, async (uuid) => {
                    if (!uuid || uuid.length < 10) {
                        console.log("Invalid UUID.");
                        process.exit(1);
                    }

                    const { error } = await supabase
                        .from('jugadores_propios')
                        .update({ Usuario: uuid })
                        .eq('id', selectedPlayer.id);

                    if (error) console.error("Update failed:", error);
                    else console.log("Success! Link created.");
                    process.exit(0);
                });
            } else {
                console.log("Invalid selection.");
                process.exit(0);
            }
        });
    });
}

async function unlinkUser(linkedPlayers) {
    if (linkedPlayers.length === 0) {
        console.log("No linked players to unlink.");
        process.exit(0);
    }

    console.log("\nLinked Players:");
    linkedPlayers.forEach((p, i) => console.log(`${i + 1}. ${p.nombre} ${p.apellidos}`));

    rl.question("\nSelect player number to UNLINK: ", async (num) => {
        const index = parseInt(num) - 1;
        if (index >= 0 && index < linkedPlayers.length) {
            const selectedPlayer = linkedPlayers[index];
            const { error } = await supabase
                .from('jugadores_propios')
                .update({ Usuario: null })
                .eq('id', selectedPlayer.id);

            if (error) console.error("Unlink failed:", error);
            else console.log(`Success! Unlinked ${selectedPlayer.nombre}.`);
            process.exit(0);
        } else {
            console.log("Invalid selection.");
            process.exit(0);
        }
    });
}

main();
