// Retrieve form elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const errorContainer = document.getElementById('error-container');
const profileContainer = document.getElementById('profile-container');
const logoutButton = document.getElementById('logout-button');

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
            displayProfilePage();
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

// Add event listener to the logout button
logoutButton.addEventListener('click', () => {
    // Clear the JWT from local storage
    localStorage.removeItem('jwt');
    displayLoginForm();
});

window.onbeforeunload = refresh;

function refresh() {
    localStorage.removeItem('jwt');
};

function displayLoginForm() {
    loginForm.style.display = 'flex';
    profileContainer.style.display = 'none';
    errorContainer.style.display = 'none';
}

function displayProfilePage() {
    loginForm.style.display = 'none';
    profileContainer.style.display = 'block';
    errorContainer.style.display = 'none';
    usernameInput.value = "";
    passwordInput.value = "";

    // Retrieve user profile data and populate the profile page
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
    makeGraphQLRequest(query);
}

function displayError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
}

// Make the GraphQL API request
async function makeGraphQLRequest(query) {
    const endpoint = 'https://01.kood.tech/api/graphql-engine/v1/graphql';

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ query }),
    })
        .then(response => response.json())
        .then(result => {
            // Populate the profile page with the retrieved data
            const { email, firstName, lastName, tel, addressCity, addressCountry } = result.data.user[0].attrs;
            const { totalDown, totalUp } = result.data.user[0];
            const transactions = result.data.user[0].transactions;

            // Define the data for the pie chart
            let totalXp = 0;
            let pieData = [
                { label: "", value: 0 },
            ];
            let lineData = [
                { month: "", value: 0 },
            ]
            for (let i = 0; i < transactions.length; i++) {
                const { type, amount, path, createdAt } = transactions[i];
                if (type === "xp" && !/piscine-js/.test(path) && !/piscine-go/.test(path)) {
                    const date = new Date(createdAt)
                    const month = date.toLocaleString('default', { month: 'long' });

                    totalXp += amount;
                    pieData.push(
                        { label: path, value: amount / 1000 },
                    )
                    lineData.push(
                        { month: month, value: totalXp / 1000 },
                    )
                }
            }
            const auditRatio = totalUp / totalDown;
            const auditDone = totalUp / 1000;
            const auditReceived = totalDown / 1000;
            document.getElementById('name').textContent = firstName + " " + lastName;
            document.getElementById('email').textContent = email;
            document.getElementById('from').textContent = addressCity + "," + addressCountry;
            document.getElementById('phone').textContent = tel;
            document.getElementById('xp').textContent = (totalXp / 1000).toFixed(0) + "kB";
            document.getElementById('audit-done').textContent = `${auditDone.toFixed(0)} kB`;
            document.getElementById('audit-received').textContent = `${auditReceived.toFixed(0)} kB`;
            document.getElementById('audit-ratio').textContent = `${auditRatio.toFixed(1)}`;

            /*// Populate grades
            const gradesList = document.getElementById('grades-list');
            grades.forEach((grade) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${grade.subject}: ${grade.grade}`;
                gradesList.appendChild(listItem);
            });*/

            // Calculate the total value
            var total = pieData.reduce(function (sum, item) {
                return sum + item.value;
            }, 0);

            // Create the pie chart
            var chart = document.getElementById("chart");
            var radius = Math.min(chart.clientWidth, chart.clientHeight) / 2;
            var cx = chart.clientWidth / 2;
            var cy = chart.clientHeight / 2;
            var startAngle = 0;

            // Create the tooltip element
            var tooltip = document.getElementById("pie-tooltip");

            pieData.forEach(function (item) {
                var sliceAngle = (item.value / total) * 360;
                var endAngle = startAngle + sliceAngle;

                // Calculate the coordinates of the slice's endpoints
                var x1 = cx + radius * Math.cos(startAngle * Math.PI / 180);
                var y1 = cy + radius * Math.sin(startAngle * Math.PI / 180);
                var x2 = cx + radius * Math.cos(endAngle * Math.PI / 180);
                var y2 = cy + radius * Math.sin(endAngle * Math.PI / 180);

                // Create a path element for the slice
                var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 ${sliceAngle > 180 ? 1 : 0},1 ${x2},${y2} Z`);
                path.setAttribute("fill", getRandomColor());

                // Attach event listeners for hover and mouseout events
                path.addEventListener("mouseover", function (event) {
                    var mouseX = event.clientX;
                    var mouseY = event.clientY;

                    // Show the tooltip and position it at the mouse coordinates
                    tooltip.style.display = "block";
                    tooltip.style.left = mouseX + "px";
                    tooltip.style.top = mouseY + "px";

                    // Set the tooltip content to the data label and value
                    tooltip.innerHTML = `${item.label}: ${item.value}`;
                });

                path.addEventListener("mouseout", function () {
                    // Hide the tooltip when mouseout occurs
                    tooltip.style.display = "none";
                });

                // Add the slice to the chart
                chart.appendChild(path);

                // Update the start angle for the next slice
                startAngle = endAngle;
            });

            // Generate a random color
            function getRandomColor() {
                var letters = "0123456789ABCDEF";
                var color = "#";
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }

            // Graph dimensions
            var width = 350;
            var height = 150;
            var margin = { top: 20, right: 20, bottom: 30, left: 50 };

            // Create the SVG element
            var svg = d3.select("#line-graph")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Define scales
            var xScale = d3.scaleBand().range([0, width]).padding(0.1);
            var yScale = d3.scaleLinear().range([height, 0]);

            // Define line
            var line = d3.line()
                .x(function (d) { return xScale(d.month); })
                .y(function (d) { return yScale(d.value); });

            // Set domain for x and y scales
            xScale.domain(lineData.map(function (d) { return d.month; }));
            yScale.domain([0, d3.max(lineData, function (d) { return d.value; })]);

            // Draw x-axis
            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale));

            // Draw y-axis
            svg.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));

            // Draw the line
            svg.append("path")
                .datum(lineData)
                .attr("class", "line")
                .attr("d", line);
        })
        .catch(error => {
            console.error("Error:", error)
        })
}
