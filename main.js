// Retrieve form elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const errorContainer = document.getElementById('error-container');

// Add event listener to the login form
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const username = usernameInput.value;
    const password = passwordInput.value;

    // Encode credentials using base64 encoding
    const credentials = btoa(`${username}:${password}`);

    try {
        // Make a POST request to the signin endpoint
        const response = await fetch('https://01.kood.tech/api/auth/signin', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
            },
        });

        if (response.ok) {
            const token = await response.json();
            // Store the JWT in local storage for future API requests
            localStorage.setItem('jwt', token);
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="profile-container">
                    <h1>My Profile</h1>
                    <div class="basic-info">
                        <h2>Basic Information</h2>
                        <p><strong>Name:</strong> <span id="name"></span></p>
                        <p><strong>Email:</strong> <span id="email"></span></p>
                        <p><strong>From:</strong> <span id="from"></span></p>
                        <p><strong>Phone:</strong> <span id="phone"></span></p>
                    </div>
                    <div class="xp-progress">
                        <h2>Progress Over Time</h2>
                    </div>
                    <div class="skill">
                        <h2>Skill</h2>
                    </div>
                    <div class="tasks">
                        <h2>Tasks</h2>
                    </div>
                    <div class="audits">
                        <h2>Audits Ratio</h2>
                        <p>Audit Ratio: <span id="audit-ratio"></span></p>
                    </div>
                    <!-- Add more sections and components as needed -->
                </div>
            `;
            // Example GraphQL query
            const query = `
                query {
                    user {
                        id
                        login
                        attrs
                        totalUp
                        totalDown
                        createdAt
                        updatedAt
                        transactions(order_by: { createdAt: asc }) {
                            id
                            userId
                            type
                            amount
                            createdAt
                            path
                        }
                    }
                }`;
            // Make the GraphQL API request and process the response
            makeGraphQLRequest(query)
        } else {
            // Handle invalid credentials
            const errorData = await response.json();
            displayError(errorData.error);
        }
    } catch (error) {
        // Handle network errors or other exceptions
        console.error('Login error:', error);
        displayError('An error occurred during login.');
    }
});

function displayError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
}

// Make the GraphQL API request
async function makeGraphQLRequest(query) {
    const endpoint = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
    const jwt = localStorage.getItem('jwt');

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ query }),
    })
        .then(response => response.json())
        .then(result => {
            // Populate the profile page with the retrieved data
            console.log(result.data)
            const { email, firstName, lastName, tel, addressCity, addressCountry } = result.data.user[0].attrs;
            const { totalDown, totalUp } = result.data.user[0];
            const transactions = result.data.user[0].transactions;
            let totalXp = 0;
            for (let i = 0; i < transactions.length; i++) {
                const { type, amount } = transactions[i];
                if (type === "xp") {
                    totalXp = totalXp + amount;
                }
            }
            const auditRatio = totalUp / totalDown;
            document.getElementById('name').textContent = firstName + " " + lastName;
            document.getElementById('email').textContent = email;
            document.getElementById('from').textContent = addressCity + "," + addressCountry;
            document.getElementById('phone').textContent = tel;
            document.getElementById('xp').textContent = totalXp;
            document.getElementById('audit-ratio').textContent = `${auditRatio.toFixed(1)}`;

            /*// Populate grades
            const gradesList = document.getElementById('grades-list');
            grades.forEach((grade) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${grade.subject}: ${grade.grade}`;
                gradesList.appendChild(listItem);
            });*/
            window.addEventListener('DOMContentLoaded', fetchAndPopulateProfileData);
        })
        .catch(error => {
            console.error("Error:", error)
        })
}