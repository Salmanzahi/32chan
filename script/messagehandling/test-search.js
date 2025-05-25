// Test file for the new keyword-based search algorithm
import { performAISearch } from './aiSearch.js';

// Sample test messages
const testMessages = [
    {
        id: '1',
        title: 'JavaScript Tutorial for Beginners',
        text: 'Learn JavaScript programming from scratch. This tutorial covers variables, functions, and objects.',
        userDisplayName: 'CodeMaster'
    },
    {
        id: '2', 
        title: 'Python vs JavaScript Comparison',
        text: 'A detailed comparison between Python and JavaScript programming languages. Both are popular choices.',
        userDisplayName: 'TechGuru'
    },
    {
        id: '3',
        title: 'Web Development Best Practices',
        text: 'Essential practices for modern web development including HTML, CSS, and JavaScript frameworks.',
        userDisplayName: 'WebDev'
    },
    {
        id: '4',
        title: 'Database Design Fundamentals',
        text: 'Learn how to design efficient databases with proper normalization and indexing strategies.',
        userDisplayName: 'DataExpert'
    },
    {
        id: '5',
        title: 'React Framework Guide',
        text: 'Complete guide to React framework for building user interfaces with JavaScript.',
        userDisplayName: 'ReactDev'
    },
    {
        id: '6',
        title: 'Tutorial Pemrograman JavaScript',
        text: 'Belajar pemrograman JavaScript dari dasar. Tutorial ini mencakup variabel, fungsi, dan objek.',
        userDisplayName: 'IndonesiaCoder'
    }
];

// Test function
async function testSearch() {
    console.log('=== Testing Keyword-Based Search Algorithm ===\n');
    
    const testQueries = [
        'JavaScript',
        'python',
        'funny',
        'tutorial',
        'programming',
        'React framework',
        'pemrograman',
        'girl',
        'web development'
    ];
    
    for (const query of testQueries) {
        console.log(`🔍 Searching for: "${query}"`);
        console.log('─'.repeat(50));
        
        try {
            const results = await performAISearch(query, testMessages);
            
            if (results.length === 0) {
                console.log('❌ No results found\n');
                continue;
            }
            
            console.log(`✅ Found ${results.length} relevant results:`);
            results.forEach((result, index) => {
                console.log(`${index + 1}. [Score: ${result.score}%] ${result.message.title}`);
                console.log(`   Author: ${result.message.userDisplayName}`);
                console.log(`   Content: ${result.message.text.substring(0, 80)}...`);
                console.log('');
            });
            
        } catch (error) {
            console.error(`❌ Error searching for "${query}":`, error);
        }
        
        console.log('='.repeat(60) + '\n');
    }
}

// Run the test
testSearch();
