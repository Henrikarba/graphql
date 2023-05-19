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
            // Successful login
            const { token } = await response.json();
            // Store the JWT securely (e.g., in local storage or a secure cookie) for future API requests
            localStorage.setItem('jwt', token);
            // Redirect or perform any other actions after successful login
            const app = document.getElementById('app');
            app.innerHTML = `
                <section class="user-identification">
                    <p id="user-id"></p>
                    <p id="user-login"></p>
                </section>

                <section class="xp-amount">
                    <!-- Display XP amount information -->
                </section>

                <section class="grades">
                    <!-- Display grades information -->
                </section>

                <section class="audits">
                    <!-- Display audits information -->
                </section>

                <section class="skills">
                    <!-- Display skills information -->
                </section>

                <section class="statistics">
                    <!-- Add the necessary elements to display statistic graphs -->
                </section>
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
                            attrs
                            createdAt
                            path
                        }
                    }
                    transaction (order_by: { createdAt: asc }) {
                        id
                        type
                        amount
                        userId
                        attrs
                        createdAt
                        path
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

// Function to make the GraphQL API request
async function makeGraphQLRequest(query) {
    const endpoint = 'https://01.kood.tech/api/graphql-engine/v1/graphql';
    const jwt = localStorage.getItem('jwt');

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': jwt
        },
        body: JSON.stringify({ query }),
    })
        .then(response => response.json())
        .then(result => {
            console.log(result)
            return result.data;
        })
        .catch(error => {
            console.error("Error:", error)
        })
}