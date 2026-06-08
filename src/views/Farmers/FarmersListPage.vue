<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">

        <div class="header-wrapper">
          <div class="header-title">
            <img
              src="@/assets/images/mao-logo-withoutbackground.png"
              class="logo"
              alt="logo"
            />

            <h2>AGRI-AKAP Beneficiary Management</h2>
          </div>

          <ion-button
            color="success"
            @click="goToRegister"
          >
            Register Farmer
          </ion-button>
        </div>

      </ion-toolbar>
    </ion-header>

    <ion-content>

      <!-- FILTERS -->

      <ion-card>
        <ion-card-content>

          <div class="filter-grid">

            <ion-input
              v-model="filters.rsbsa_no"
              fill="outline"
              label="RSBSA No"
            />

            <ion-select
              v-model="filters.barangay"
              fill="outline"
              label="Barangay"
              interface="popover"
            >
              <ion-select-option
                v-for="barangay in barangayOptions"
                :key="barangay"
                :value="barangay"
              >
                {{ barangay }}
              </ion-select-option>
            </ion-select>

            <ion-select
              v-model="filters.sex"
              fill="outline"
              label="Sex"
              interface="popover"
            >
              <ion-select-option value="Male">
                Male
              </ion-select-option>

              <ion-select-option value="Female">
                Female
              </ion-select-option>
            </ion-select>

            <ion-select
              v-model="filters.livelihood"
              fill="outline"
              label="Livelihood"
              interface="popover"
            >
              <ion-select-option
                v-for="item in livelihoodOptions"
                :key="item"
                :value="item"
              >
                {{ item }}
              </ion-select-option>
            </ion-select>

          </div>

        </ion-card-content>
      </ion-card>

      <!-- TABLE -->

      <ion-card>

        <div class="table-wrapper">

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>RSBSA No</th>
                <th>Name</th>
                <th>Sex</th>
                <th>Barangay</th>
                <th>Mobile Number</th>
                <th>Livelihood</th>
                <th>Civil Status</th>
                <th>PWD</th>
                <th>4Ps</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              <tr
                v-for="(farmer,index) in filteredFarmers"
                :key="farmer.id"
              >
                <td>{{ index + 1 }}</td>

                <td>{{ farmer.rsbsa_no }}</td>

                <td>
                  {{ fullName(farmer) }}
                </td>

                <td>{{ farmer.sex }}</td>

                <td>{{ farmer.permanent_brgy }}</td>

                <td>{{ farmer.mobile_number }}</td>

                <td>{{ farmer.livelihood_type }}</td>

                <td>{{ farmer.civil_status }}</td>

                <td>
                  {{ farmer.is_pwd ? 'Yes' : 'No' }}
                </td>

                <td>
                  {{ farmer.is_4ps_beneficiary ? 'Yes' : 'No' }}
                </td>

                <td>
                  <ion-button
                    size="small"
                    color="success"
                  >
                    View
                  </ion-button>
                </td>
              </tr>

              <tr v-if="filteredFarmers.length === 0">
                <td colspan="11" class="empty-row">
                  No registered farmers found
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </ion-card>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

const farmers = ref([]);

const filters = ref({
  rsbsa_no: "",
  barangay: "",
  sex: "",
  livelihood: ""
});

const goToRegister = () => {
  router.push("/register");
};

const loadFarmers = async () => {
  try {

    const response = await axios.get("http://127.0.0.1:8000/api/farmers");

    farmers.value = response.data;

  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  loadFarmers();
});

const barangayOptions = computed(() => {

  const uniqueBarangays = [
    ...new Set(
      farmers.value
        .map(item => item.permanent_brgy)
        .filter(Boolean)
    )
  ];

  return uniqueBarangays.sort();
});

const livelihoodOptions = computed(() => {

  const uniqueLivelihoods = [
    ...new Set(
      farmers.value
        .map(item => item.livelihood_type)
        .filter(Boolean)
    )
  ];

  return uniqueLivelihoods.sort();
});

const fullName = (farmer) => {

  return [
    farmer.first_name,
    farmer.middle_name,
    farmer.surname,
    farmer.ext_name
  ]
    .filter(Boolean)
    .join(" ");
};

const filteredFarmers = computed(() => {

  return farmers.value.filter((farmer) => {

    const rsbsaMatch =
      !filters.value.rsbsa_no ||
      farmer.rsbsa_no
        ?.toLowerCase()
        .includes(
          filters.value.rsbsa_no.toLowerCase()
        );

    const barangayMatch =
      !filters.value.barangay ||
      farmer.permanent_brgy ===
      filters.value.barangay;

    const sexMatch =
      !filters.value.sex ||
      farmer.sex === filters.value.sex;

    const livelihoodMatch =
      !filters.value.livelihood ||
      farmer.livelihood_type ===
      filters.value.livelihood;

    return (
      rsbsaMatch &&
      barangayMatch &&
      sexMatch &&
      livelihoodMatch
    );
  });
});
</script>


























<style scoped>

.custom-toolbar {
  --background: #f5f5f5;
}

.header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 50px;
  height: 50px;
}

.header-title h2 {
  font-size: 18px;
  color: #2e7d32;
  margin: 0;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
  gap: 12px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

thead {
  background: #7ac36a;
}

thead th {
  color: white;
  padding: 14px;
  text-align: left;
  font-size: 14px;
}

tbody td {
  padding: 14px;
  border-bottom: 1px solid #e5e5e5;
}

tbody tr:hover {
  background: #f7f7f7;
}

.empty-row {
  text-align: center;
  padding: 30px;
  color: gray;
}
</style>