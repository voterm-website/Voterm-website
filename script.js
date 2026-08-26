/* =========================================
   VOICE ON THE ROCK
   WEBSITE JAVASCRIPT
========================================= */


/* MOBILE MENU */

const menuToggle =
    document.querySelector(".menu-toggle");

const navigation =
    document.querySelector(".navigation");


if (menuToggle) {

    menuToggle.addEventListener("click", () => {

        navigation.classList.toggle("open");

    });

}


/* CLOSE MOBILE MENU AFTER CLICKING */

document
    .querySelectorAll(".navigation a")
    .forEach(link => {

        link.addEventListener("click", () => {

            navigation.classList.remove("open");

        });

    });


/* COPY DONATION ACCOUNT NUMBERS */

document
    .querySelectorAll(".copy-button")
    .forEach(button => {

        button.addEventListener("click", async () => {

            const number =
                button.getAttribute("data-copy");

            try {

                await navigator.clipboard.writeText(number);

                const originalText =
                    button.textContent;

                button.textContent =
                    "Copied ✓";

                setTimeout(() => {

                    button.textContent =
                        originalText;

                }, 1800);

            } catch (error) {

                alert(
                    "Account number: " + number
                );

            }

        });

    });


/* CURRENT YEAR */

const year =
    document.getElementById("year");

if (year) {

    year.textContent =
        new Date().getFullYear();

}
