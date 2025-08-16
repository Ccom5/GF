// form.js - Formulario de contacto con Formspree

document.getElementById("contactForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Clear previous errors
    const errorElements = document.querySelectorAll(".error-message");
    errorElements.forEach((el) => (el.style.display = "none"));

    // Hide success message
    document.getElementById("successMessage").style.display = "none";

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const message = document.getElementById("message").value.trim();

    // Validation flags
    let isValid = true;

    // Name validation
    if (name === "") {
        document.getElementById("nameError").textContent = "El nombre es requerido";
        document.getElementById("nameError").style.display = "block";
        isValid = false;
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email === "" || !emailPattern.test(email)) {
        document.getElementById("emailError").textContent = "Se requiere un email válido";
        document.getElementById("emailError").style.display = "block";
        isValid = false;
    }

    // Message validation
    if (message === "") {
        document.getElementById("messageError").textContent = "El mensaje es requerido";
        document.getElementById("messageError").style.display = "block";
        isValid = false;
    }

    // If form is not valid, stop here
    if (!isValid) {
        return;
    }

    // Show loading state
    const submitButton = document.querySelector(".submit-button");
    const buttonText = document.getElementById("buttonText");
    const buttonLoading = document.getElementById("buttonLoading");

    submitButton.disabled = true;
    buttonText.style.display = "none";
    buttonLoading.style.display = "inline";

    try {
        // Get form data
        const formData = new FormData(this);

        // Send to Formspree
        const response = await fetch(this.action, {
            method: "POST",
            body: formData,
            headers: {
                Accept: "application/json"
            }
        });

        if (response.ok) {
            // Success
            document.getElementById("successMessage").style.display = "block";
            this.reset(); // Clear form

            // Scroll to success message
            document.getElementById("successMessage").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        } else {
            // Error from server
            throw new Error("Error del servidor");
        }
    } catch (error) {
        // Network or other error
        alert("Hubo un error al enviar el mensaje. Por favor intente nuevamente.");
        console.error("Error:", error);
    } finally {
        // Reset button state
        submitButton.disabled = false;
        buttonText.style.display = "inline";
        buttonLoading.style.display = "none";
    }
});

// Optional: Clear error messages when user starts typing
document.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", function () {
        const errorElement = document.getElementById(this.id + "Error");
        if (errorElement) {
            errorElement.style.display = "none";
        }
    });
});
