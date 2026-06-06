<template>
  <ion-page>
    <ion-content :fullscreen="true" class="ion-padding auth-bg">
      
      <div class="brand-header">
        <div class="logo-container">
           <img src="@/assets/images/mao-logo-withoutbackground.png" alt="Municipal Agriculture Office Echague Logo" />
        </div>
        <h1 class="brand-title">AGRI-AKAP</h1>
        <p class="brand-subtitle">Agricultural Assistance and Knowledge Access Portal for Managing Farmers' Subsidies and Support Programs</p>
      </div>

      <div class="login-card">
        <h2 class="form-title">Welcome Back</h2>
        
        <div class="input-group">
          <ion-item class="custom-input" lines="none">
            <ion-icon :icon="person" slot="start" class="input-icon"></ion-icon>
            <ion-input 
              v-model="credentials.email" 
              label="Email Address"
              autocomplete="off"
              label-placement="floating"
              type="email"
              placeholder="Enter your email">
            </ion-input>
          </ion-item>

          <ion-item class="custom-input" lines="none">
            <ion-icon :icon="lockClosed" slot="start" class="input-icon"></ion-icon>
            <ion-input
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              label="Password"
              label-placement="floating"
              placeholder="Enter your password"
              autocomplete="new-password">
            </ion-input>
            <ion-button fill="clear" slot="end" class="toggle-password-btn" @click="togglePassword">
              <ion-icon :icon="showPassword ? eyeOff : eye" color="medium"></ion-icon>
            </ion-button>
          </ion-item>
        </div>
        
        <div class="forgot-password">
          <a href="#">Forgot Password?</a>
        </div>
        
        <ion-button 
          expand="block" 
          shape="round" 
          class="login-button" 
          @click="login" 
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Logging In...' : 'Log In' }}
        </ion-button>     
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  IonContent,
  IonPage,
  IonIcon,
  IonButton,
  IonItem,
  IonInput,
} from "@ionic/vue";
import { person, lockClosed, eye, eyeOff } from "ionicons/icons";
import axios from "axios";
import { useRouter } from "vue-router";

// Point to your Laravel backend
const API_URL = "http://127.0.0.1:8000"; 
const router = useRouter();

const isSubmitting = ref(false);
const showPassword = ref(false);

const credentials = reactive({
  email: "",
  password: "",
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const login = async () => {
  if (!credentials.email || !credentials.password) {
    alert("Email and password are required");
    return;
  }

  isSubmitting.value = true;

  try {
    // FIX 1: Attach a device_name to the payload to satisfy the backend requirement
    const payload = {
      email: credentials.email,
      password: credentials.password,
      device_name: navigator.userAgent || "Web Dashboard", 
    };

    const response = await axios.post(`${API_URL}/api/login`, payload, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
    });

    // FIX 2: Check for our custom API contract -> response.data.status === 'success'
    if (response.status === 200 && response.data.status === 'success') {
      
      const responseData = response.data.data; // Our standardized data wrapper

      // FIX 3: Store BOTH the Token and the User profile
      localStorage.setItem("token", responseData.access_token);
      localStorage.setItem("user", JSON.stringify(responseData.user));

      alert("Log In Successful!");

      // Route based on RBAC (matching the exact roles from our migration)
      if (responseData.user.role === "admin") {
        router.push("/dashboard"); // Adjust to your actual admin route
      } else {
        router.push("/HomePage"); // Adjust to your actual tech route
      }

      // Clear form
      credentials.email = "";
      credentials.password = "";
    }
  } catch (error: any) {
    console.error("Login Error:", error);
    
    // Better error handling to show EXACTLY what Laravel is rejecting
    if (error.response && error.response.status === 422) {
      alert("Validation Error: Please check your email and password format.");
    } else if (error.response && error.response.status === 401) {
      alert(error.response.data.message || "Invalid email or password.");
    } else {
      alert("Network error. Ensure your Laravel backend is running on port 8000.");
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.auth-bg {
  --background: radial-gradient(circle at 50% 0%, #e8f5e9 0%, #c8e6c9 60%, #a5d6a7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-header {
  text-align: center;
  margin-top: 8vh;
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease-out;
}

.logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: transparent; /* Fixed: Removed background gradient so logo shows fully */
  border-radius: 50%;
  box-shadow: 0 10px 20px rgba(45, 136, 77, 0.4);
  margin-bottom: 1rem;
  animation: float 4s ease-in-out infinite;
  border: 4px solid rgba(255, 255, 255, 0.8);
  overflow: hidden; /* Fixed: Prevents the image edges from spilling out */
}

.logo-container img {
  width: 100%; /* Fixed: Stretches image to container bounds */
  height: 100%; /* Fixed: Stretches image to container bounds */
  object-fit: cover; /* Fixed: Fills the entire circle perfectly */
  display: block;
  border-radius: 50%;
}

.logo-icon {
  font-size: 44px;
  color: #ffffff;
}

.brand-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1b5e20;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 1rem;
  color: #388e3c;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 28px;
  padding: 2.5rem 1.5rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  margin: 0 auto;
  max-width: 420px;
  width: 100%;
  animation: fadeInUp 0.8s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.custom-input {
  --background: #f4f8f5;
  --color: #1a1a1a; 
  --placeholder-color: #6a7c6f; 
  --border-radius: 16px;
  --padding-start: 1rem;
  --inner-padding-end: 0.5rem;
  border: 2px solid transparent;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.custom-input:focus-within {
  border-color: #4caf50;
  --background: #ffffff;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
  transform: translateY(-2px);
}

.input-icon {
  color: #2d884d;
  font-size: 1.25rem;
  margin-right: 0.75rem;
  transition: color 0.3s ease;
}

.custom-input:focus-within .input-icon {
  color: #1b5e20;
}

.toggle-password-btn {
  margin: 0;
  --padding-start: 0.5rem;
  --padding-end: 0.5rem;
}

/* Forgot Password */
.forgot-password {
  text-align: right;
  margin-top: 0.75rem;
  margin-bottom: 2rem;
}

.forgot-password a {
  color: #2d884d;
  font-size: 0.9rem;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.forgot-password a:hover {
  color: #1b5e20;
  text-decoration: underline;
}

/* Main Button */
.login-button {
  --background: linear-gradient(135deg, #4caf50, #2d884d);
  --background-hover: #388e3c;
  --background-activated: #1b5e20;
  --border-radius: 16px;
  --box-shadow: 0 8px 20px rgba(45, 136, 77, 0.4);
  margin: 0;
  height: 56px;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  transition: transform 0.2s active;
}

.login-button:active {
  transform: scale(0.98);
}

/* Keyframe Animations */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>