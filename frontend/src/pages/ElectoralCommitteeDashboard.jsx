import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  LogOut,
  Menu,
  Home,
  Users,
  User,
  UserCheck,
  BarChart2,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import {
  getCandidates,
  getElections,
  createElection,
  getVoters,
  updateElection,
  deleteElection,
  addCandidateElectoral,
  updateCandidate,
  deleteCandidate
} from "../api/endpoints";

// Pagination Component
const Pagination = React.memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage, 
  itemsName 
}) => {
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded border ${
            currentPage === i
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalItems} {itemsName}
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`p-2 rounded border ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded border ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded border ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded border ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// SearchInput Component
const SearchInput = React.memo(({ 
  value, 
  onChange, 
  onSearch, 
  onClear, 
  placeholder, 
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleClear = () => {
    onChange('');
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={itemsPerPage}
            onChange={onItemsPerPageChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>
    </div>
  );
});

const ElectoralCommitteeDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [elections, setElections] = useState([]);
  const [newElection, setNewElection] = useState({ title: "", startDate: "", endDate: "" });
  
  // Voter states with pagination
  const [voters, setVoters] = useState([]);
  const [voterCurrentPage, setVoterCurrentPage] = useState(1);
  const [voterTotalPages, setVoterTotalPages] = useState(1);
  const [voterTotalItems, setVoterTotalItems] = useState(0);
  const [voterItemsPerPage, setVoterItemsPerPage] = useState(10);
  const [voterSearchQuery, setVoterSearchQuery] = useState('');
  const [votersLoading, setVotersLoading] = useState(false);

  // Candidate states with pagination
  const [candidates, setCandidates] = useState([]);
  const [candidateCurrentPage, setCandidateCurrentPage] = useState(1);
  const [candidateTotalPages, setCandidateTotalPages] = useState(1);
  const [candidateTotalItems, setCandidateTotalItems] = useState(0);
  const [candidateItemsPerPage, setCandidateItemsPerPage] = useState(9);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedDates, setEditedDates] = useState({ startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Candidate Registration Form States
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [candidateFormData, setCandidateFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    partyName: "",
    position: "Mayor",
    manifesto: "",
    photo: "",
    politicalSign: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [candidateLoading, setCandidateLoading] = useState(false);

  // Edit Candidate Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    partyName: "",
    position: "Mayor",
    manifesto: "",
    photo: "",
    politicalSign: ""
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [updatingCandidateId, setUpdatingCandidateId] = useState(null);
  const [deletingCandidateId, setDeletingCandidateId] = useState(null);

  const positions = ["Mayor"];

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { id: "voters", label: "Voters", icon: <Users className="w-5 h-5" /> },
    { id: "candidates", label: "Candidates", icon: <UserCheck className="w-5 h-5" /> },
    { id: "elections", label: "Elections", icon: <BarChart2 className="w-5 h-5" /> },
  ];

  useEffect(() => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
  }, [user]);

  // Fetch elections
  const fetchElectionsData = async () => {
    try {
      const electionsResponse = await getElections();
      const electionsData = electionsResponse.data || electionsResponse || [];
      setElections(Array.isArray(electionsData) ? electionsData : []);
    } catch (error) {
      console.error("Error fetching elections:", error);
      setElections([]);
    }
  };

  // Fetch voters with pagination
  const fetchVotersData = useCallback(async (page = voterCurrentPage, limit = voterItemsPerPage, search = voterSearchQuery) => {
    try {
      setVotersLoading(true);
      const votersResponse = await getVoters(page, limit, search);
      console.log('Voters response:', votersResponse);
      
      setVoters(votersResponse.results || votersResponse.data || []);
      setVoterTotalItems(votersResponse.totalVoters || votersResponse.total || 0);
      setVoterTotalPages(votersResponse.totalPages || 1);
      setVoterCurrentPage(votersResponse.currentPage || page);
      
    } catch (error) {
      console.error("Error fetching voters:", error);
    } finally {
      setVotersLoading(false);
    }
  }, [voterCurrentPage, voterItemsPerPage, voterSearchQuery]);

  // Fetch candidates with pagination
  const fetchCandidatesData = useCallback(async (page = candidateCurrentPage, limit = candidateItemsPerPage, search = candidateSearchQuery) => {
    try {
      setCandidatesLoading(true);
      const candidatesResponse = await getCandidates(page, limit, search);
      console.log('Candidates response:', candidatesResponse);
      
      const candidatesArray = candidatesResponse.results || candidatesResponse.data || candidatesResponse || [];
      setCandidates(Array.isArray(candidatesArray) ? candidatesArray : []);
      setCandidateTotalItems(candidatesResponse.totalCandidates || candidatesResponse.total || 0);
      setCandidateTotalPages(candidatesResponse.totalPages || 1);
      setCandidateCurrentPage(candidatesResponse.currentPage || page);
      
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setCandidatesLoading(false);
    }
  }, [candidateCurrentPage, candidateItemsPerPage, candidateSearchQuery]);

  // Voter pagination handlers
  const handleVoterPageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= voterTotalPages) {
      setVoterCurrentPage(newPage);
      fetchVotersData(newPage, voterItemsPerPage, voterSearchQuery);
    }
  }, [voterTotalPages, voterItemsPerPage, voterSearchQuery, fetchVotersData]);

  const handleVoterSearch = useCallback(() => {
    setVoterCurrentPage(1);
    fetchVotersData(1, voterItemsPerPage, voterSearchQuery);
  }, [voterItemsPerPage, voterSearchQuery, fetchVotersData]);

  const handleVoterItemsPerPageChange = useCallback((e) => {
    const newLimit = parseInt(e.target.value);
    setVoterItemsPerPage(newLimit);
    setVoterCurrentPage(1);
    fetchVotersData(1, newLimit, voterSearchQuery);
  }, [voterSearchQuery, fetchVotersData]);

  const handleVoterSearchClear = useCallback(() => {
    setVoterSearchQuery('');
    setVoterCurrentPage(1);
    fetchVotersData(1, voterItemsPerPage, '');
  }, [voterItemsPerPage, fetchVotersData]);

  // Candidate pagination handlers
  const handleCandidatePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= candidateTotalPages) {
      setCandidateCurrentPage(newPage);
      fetchCandidatesData(newPage, candidateItemsPerPage, candidateSearchQuery);
    }
  }, [candidateTotalPages, candidateItemsPerPage, candidateSearchQuery, fetchCandidatesData]);

  const handleCandidateSearch = useCallback(() => {
    setCandidateCurrentPage(1);
    fetchCandidatesData(1, candidateItemsPerPage, candidateSearchQuery);
  }, [candidateItemsPerPage, candidateSearchQuery, fetchCandidatesData]);

  const handleCandidateItemsPerPageChange = useCallback((e) => {
    const newLimit = parseInt(e.target.value);
    setCandidateItemsPerPage(newLimit);
    setCandidateCurrentPage(1);
    fetchCandidatesData(1, newLimit, candidateSearchQuery);
  }, [candidateSearchQuery, fetchCandidatesData]);

  const handleCandidateSearchClear = useCallback(() => {
    setCandidateSearchQuery('');
    setCandidateCurrentPage(1);
    fetchCandidatesData(1, candidateItemsPerPage, '');
  }, [candidateItemsPerPage, fetchCandidatesData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchElectionsData();
        if (activeSection === "voters") {
          await fetchVotersData();
        } else if (activeSection === "candidates") {
          await fetchCandidatesData();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [activeSection, fetchVotersData, fetchCandidatesData]);

  // Function to calculate end date
  const calculateEndDate = (startDate) => {
    if (!startDate) return '';

    const date = new Date(startDate);
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = reader.result;
      const { name } = e.target;
      setCandidateFormData(prev => ({ 
        ...prev, 
        [name]: image,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = reader.result;
      const { name } = e.target;
      setEditFormData(prev => ({ ...prev, [name]: image }));
    };
    reader.readAsDataURL(file);
  };

  // Candidate Form Handlers with validation
  const handleCandidateInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "fullName") {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 30);
      setCandidateFormData(prev => ({ ...prev, [name]: lettersOnly }));
    } else if (name === "password") {
      setCandidateFormData(prev => ({ ...prev, [name]: value.slice(0, 30) }));
    } else if (name === "partyName") {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 15);
      setCandidateFormData(prev => ({ ...prev, [name]: lettersOnly }));
    } else if (name === "email") {
      setCandidateFormData(prev => ({ ...prev, [name]: value.slice(0, 40) }));
    } else if (name === "age") {
      const numbersOnly = value.replace(/[^0-9]/g, "").slice(0, 2);
      setCandidateFormData(prev => ({ ...prev, [name]: numbersOnly }));
    } else if (name === "manifesto") {
      setCandidateFormData(prev => ({ ...prev, [name]: value.slice(0, 150) }));
    } else {
      setCandidateFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "fullName") {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 30);
      setEditFormData(prev => ({ ...prev, [name]: lettersOnly }));
    } else if (name === "password") {
      setEditFormData(prev => ({ ...prev, [name]: value.slice(0, 30) }));
    } else if (name === "partyName") {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 15);
      setEditFormData(prev => ({ ...prev, [name]: lettersOnly }));
    } else if (name === "email") {
      setEditFormData(prev => ({ ...prev, [name]: value.slice(0, 40) }));
    } else if (name === "age") {
      const numbersOnly = value.replace(/[^0-9]/g, "").slice(0, 2);
      setEditFormData(prev => ({ ...prev, [name]: numbersOnly }));
    } else if (name === "manifesto") {
      setEditFormData(prev => ({ ...prev, [name]: value.slice(0, 150) }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (editFormErrors[name]) {
      setEditFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateCandidateForm = () => {
    const errors = {};

    if (!candidateFormData.fullName.trim()) errors.fullName = "Full name is required";
    if (!candidateFormData.email.trim()) errors.email = "Email is required";
    else if (!candidateFormData.email.includes("@")) errors.email = "Invalid email address";
    if (!candidateFormData.password) errors.password = "Password is required";
    else if (candidateFormData.password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!candidateFormData.age) errors.age = "Age is required";
    else if (candidateFormData.age < 21 || candidateFormData.age > 100) errors.age = "Age must be between 21 and 100";
    if (!candidateFormData.gender) errors.gender = "Gender is required";
    if (!candidateFormData.partyName.trim()) errors.partyName = "Party name is required";
    if (!candidateFormData.position) errors.position = "Position is required";
    if (!candidateFormData.manifesto.trim()) errors.manifesto = "Manifesto is required";
    if (!candidateFormData.photo) errors.photo = "Photo is required";
    if (!candidateFormData.politicalSign) errors.politicalSign = "Political Sign is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData.fullName.trim()) errors.fullName = "Full name is required";
    if (!editFormData.email.trim()) errors.email = "Email is required";
    else if (!editFormData.email.includes("@")) errors.email = "Invalid email address";
    if (!editFormData.password) errors.password = "Password is required";
    else if (editFormData.password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!editFormData.age) errors.age = "Age is required";
    else if (editFormData.age < 21 || editFormData.age > 100) errors.age = "Age must be between 21 and 100";
    if (!editFormData.gender) errors.gender = "Gender is required";
    if (!editFormData.partyName.trim()) errors.partyName = "Party name is required";
    if (!editFormData.position) errors.position = "Position is required";
    if (!editFormData.manifesto.trim()) errors.manifesto = "Manifesto is required";

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();

    if (!validateCandidateForm()) return;

    setCandidateLoading(true);
    try {
      const candidatePayload = {
        fullName: candidateFormData.fullName,
        email: candidateFormData.email,
        password: candidateFormData.password,
        age: parseInt(candidateFormData.age),
        gender: candidateFormData.gender,
        partyName: candidateFormData.partyName,
        position: candidateFormData.position,
        manifesto: candidateFormData.manifesto,
        photo: candidateFormData.photo,
        politicalSign: candidateFormData.politicalSign
      };

      console.log('Creating candidate:', candidatePayload);

      const response = await addCandidateElectoral(candidatePayload);

      if (response.success || response.data) {
        // Reset form
        setCandidateFormData({
          fullName: "",
          email: "",
          password: "",
          age: "",
          gender: "",
          partyName: "",
          position: "",
          manifesto: "",
          photo: "",
          politicalSign: ""
        });
        setFormErrors({});
        setShowCandidateForm(false);

        // Refresh candidates list
        await fetchCandidatesData();
        alert("Candidate registered successfully!");
      } else {
        alert(response.message || "Failed to register candidate");
      }
    } catch (error) {
      console.error("Error registering candidate:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to register candidate";
      alert(`Error: ${errorMessage}`);
    } finally {
      setCandidateLoading(false);
    }
  };

  // Edit Candidate Functions
  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setEditFormData({
      fullName: candidate.fullName || "",
      email: candidate.email || "",
      password: candidate.password || "",
      age: candidate.age || "",
      gender: candidate.gender || "",
      partyName: candidate.partyName || "",
      position: candidate.position || "Mayor",
      manifesto: candidate.manifesto || "",
      photo: candidate.photo || "",
      politicalSign: candidate.politicalSign || ""
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) return;

    setEditLoading(true);
    setUpdatingCandidateId(editingCandidate._id);
    try {
      const candidatePayload = {
        fullName: editFormData.fullName,
        email: editFormData.email,
        password: editFormData.password,
        age: parseInt(editFormData.age),
        gender: editFormData.gender,
        partyName: editFormData.partyName,
        position: editFormData.position,
        manifesto: editFormData.manifesto,
        photo: editFormData.photo,
        politicalSign: editFormData.politicalSign
      };

      console.log('Updating candidate:', candidatePayload);

      const response = await updateCandidate(editingCandidate._id, candidatePayload);
      console.log('Update response:', response);

      // Handle different API response structures
      let updatedCandidate;
      if (response.data) {
        updatedCandidate = response.data;
      } else if (response.candidate) {
        updatedCandidate = response.candidate;
      } else if (response.success) {
        // If API only returns success, use the payload with original ID
        updatedCandidate = { ...candidatePayload, _id: editingCandidate._id };
      } else {
        // Fallback to payload if no useful response
        updatedCandidate = { ...candidatePayload, _id: editingCandidate._id };
      }

      // Update local state immediately
      setCandidates(prevCandidates => 
        prevCandidates.map(candidate => 
          candidate._id === editingCandidate._id 
            ? { ...candidate, ...updatedCandidate }
            : candidate
        )
      );

      // If the selected candidate is the one being edited, update it too
      if (selectedCandidate && selectedCandidate._id === editingCandidate._id) {
        setSelectedCandidate(prev => ({ ...prev, ...updatedCandidate }));
      }

      setShowEditModal(false);
      setEditingCandidate(null);
      setEditFormData({
        fullName: "",
        email: "",
        password: "",
        age: "",
        gender: "",
        partyName: "",
        position: "",
        manifesto: "",
        photo: "",
        politicalSign: ""
      });
      setEditFormErrors({});

      alert("Candidate updated successfully!");

    } catch (error) {
      console.error("Error updating candidate:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update candidate";
      alert(`Error: ${errorMessage}`);
    } finally {
      setEditLoading(false);
      setUpdatingCandidateId(null);
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) {
      return;
    }

    setDeletingCandidateId(candidateId);
    try {
      // Optimistically remove from UI
      setCandidates(prevCandidates =>
        prevCandidates.filter(candidate => candidate._id !== candidateId)
      );

      // If viewing the deleted candidate, clear selection
      if (selectedCandidate && selectedCandidate._id === candidateId) {
        setSelectedCandidate(null);
      }

      const response = await deleteCandidate(candidateId);

      if (!response.success) {
        // If API call fails, revert the UI change and show error
        await fetchCandidatesData();
        alert(response.message || "Failed to delete candidate");
      } else {
        alert("Candidate deleted successfully!");
      }
    } catch (error) {
      // If API call fails, revert the UI change
      await fetchCandidatesData();
      console.error("Error deleting candidate:", error);
      alert("Failed to delete candidate");
    } finally {
      setDeletingCandidateId(null);
    }
  };

  // Handle election form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "startDate") {
      const endDate = calculateEndDate(value);
      setNewElection({
        ...newElection,
        startDate: value,
        endDate: endDate
      });
    } else {
      setNewElection({
        ...newElection,
        [name]: value
      });
    }
  };

  // Handle edited dates changes (for managing elections)
  const handleEditedDatesChange = (field, value) => {
    if (field === "startDate") {
      const endDate = calculateEndDate(value);
      setEditedDates({
        startDate: value,
        endDate: endDate
      });
    } else {
      setEditedDates(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Create election function
  const handleCreateElection = async () => {
    console.log('Creating election with data:', newElection);

    if (!newElection.title || !newElection.startDate || !newElection.endDate) {
      alert("Please fill all fields");
      return;
    }

    if (!["admin", "electoral_committee"].includes(user?.role)) {
      alert("Only admins or committee members can create elections");
      return;
    }

    // Validate dates
    if (new Date(newElection.endDate) <= new Date(newElection.startDate)) {
      alert("End date must be after start date");
      return;
    }

    try {
      const electionPayload = {
        title: newElection.title,
        startDate: newElection.startDate,
        endDate: newElection.endDate,
        description: `Election for ${newElection.title}`,
        candidates: [],
        eligibleVoterIds: []
      };

      console.log('Sending election payload:', electionPayload);

      const response = await createElection(electionPayload);
      console.log('Create election response:', response);

      if (response.success || response.data) {
        setNewElection({ title: "", startDate: "", endDate: "" });
        await fetchElectionsData();
        alert("Election created successfully!");
      } else {
        alert(response.message || "Failed to create election");
      }
    } catch (error) {
      console.error("Error creating election:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create election";
      alert(`Error: ${errorMessage}`);
    }
  };

  // DELETE election
  const handleDeleteElection = async (electionId) => {
    if (!window.confirm("Are you sure you want to DELETE this election? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteElection(electionId);

      if (response.success) {
        setElections(prevElections =>
          prevElections.filter(election => election._id !== electionId)
        );

        alert("Election deleted successfully!");
      } else {
        alert(response.message || "Failed to delete election");
        await fetchElectionsData();
      }
    } catch (error) {
      console.error("Error deleting election:", error);
      alert("Failed to delete election");
      await fetchElectionsData();
    } finally {
      setLoading(false);
    }
  };

  // Update election
  const handleUpdateElection = async (electionId) => {
    if (!editedDates.startDate) {
      alert("Please fill start date");
      return;
    }

    // End date is automatically calculated from start date + 3 days
    const endDate = calculateEndDate(editedDates.startDate);

    try {
      const response = await updateElection(
        electionId,
        { startDate: editedDates.startDate, endDate: endDate }
      );

      if (response.success) {
        setEditingId(null);
        setEditedDates({ startDate: "", endDate: "" });
        await fetchElectionsData();
        alert("Election updated successfully!");
      } else {
        alert(response.message || "Failed to update election");
      }
    } catch (error) {
      console.error("Error updating election:", error);
      alert("Failed to update election");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleBack = () => setSelectedCandidate(null);

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
  };

  // Section Components
  const DashboardSection = () => (
    <div className="space-y-8">
      {/* Create Election Form */}
      <div className="bg-white border border-gray-300 p-6 mt-11 rounded-lg shadow-md max-w-md mx-auto space-y-5" style={{ minHeight: "340px" }}>
        <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center">Create New Election</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <label className="block text-md font-medium text-gray-700 w-1/3">
              Location:
            </label>
            <input
              type="text"
              name="title"
              placeholder="Enter Election Location"
              value={newElection.title}
              onChange={handleChange}
              className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center">
            <label className="text-md font-medium text-gray-700 w-1/3">
              Start Date:
            </label>
            <input
              type="date"
              name="startDate"
              value={newElection.startDate}
              onChange={handleChange}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center">
            <label className="text-md font-medium text-gray-700 w-1/3">
              End Date:
            </label>
            <input
              type="date"
              name="endDate"
              value={newElection.endDate}
              onChange={handleChange}
              className="w-2/3 border border-gray-400 p-2 rounded focus:outline-none focus:ring focus:ring-blue-600 bg-gray-100"
              disabled
            />
          </div>
          <button
            onClick={handleCreateElection}
            className="w-full bg-blue-700 text-white hover:bg-blue-800 py-2 rounded"
          >
            Create Election
          </button>
        </div>
      </div>

      {/* Manage Created Elections */}
      <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md max-w-6xl mx-auto space-y-4">
        <h3 className="text-2xl font-bold text-blue-800 text-center mb-2">Created Elections</h3>
        {elections.length === 0 ? (
          <p className="text-center text-gray-600">No elections created yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {elections.map((e) => (
              <li
                key={e._id || e.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center py-3 px-4 hover:bg-gray-50 rounded transition"
              >
                <div>
                  <p className="font-semibold text-blue-900">{e.title}</p>
                  <p className="text-sm text-gray-600">
                    Start: {new Date(e.startDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    End: {new Date(e.endDate).toLocaleDateString()}
                  </p>
                </div>

                {editingId === e._id ? (
                  <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0">
                    <input
                      type="date"
                      value={editedDates.startDate}
                      onChange={(ev) => handleEditedDatesChange('startDate', ev.target.value)}
                      min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      className="border p-1 rounded text-sm"
                    />
                    <input
                      type="date"
                      value={calculateEndDate(editedDates.startDate)}
                      className="border p-1 rounded text-sm bg-gray-100"
                      disabled
                    />
                    <button
                      onClick={() => handleUpdateElection(e._id)}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded "
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded "
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3 md:mt-0">
                    <button
                      onClick={() => {
                        setEditingId(e._id);
                        setEditedDates({
                          startDate: e.startDate.split('T')[0],
                          endDate: e.endDate.split('T')[0],
                        });
                      }}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleDeleteElection(e._id)}
                      className="bg-[#ff5154]  hover:bg-[#fc161a] text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const VotersSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-indigo-500/90">Voter List</h2>
      </div>

      {/* Search and Controls */}
      <SearchInput
        value={voterSearchQuery}
        onChange={setVoterSearchQuery}
        onSearch={handleVoterSearch}
        onClear={handleVoterSearchClear}
        placeholder="Search by name or voter ID..."
        itemsPerPage={voterItemsPerPage}
        onItemsPerPageChange={handleVoterItemsPerPageChange}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{voterTotalItems}</p>
              <p className="text-sm text-gray-600">Total Voters</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {voters.filter(v => v.verified).length}
              </p>
              <p className="text-sm text-gray-600">Verified Voters</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <User className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {voters.filter(v => !v.verified).length}
              </p>
              <p className="text-sm text-gray-600">Pending Verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Voters Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0acbae]">Registered Voters</h3>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {voterTotalItems} total voters
            </span>
            <span className="text-sm text-gray-600">
              Page {voterCurrentPage} of {voterTotalPages}
            </span>
          </div>
        </div>

        {votersLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2">Loading voters...</p>
          </div>
        ) : voters.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {voterSearchQuery ? 'No voters found matching your search.' : 'No voters registered yet.'}
            </p>
            <p className="text-gray-400">
              {voterSearchQuery ? 'Try adjusting your search terms.' : 'Voters will appear here once registered.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">National ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date of Birth</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((v) => (
                    <tr key={v._id || v.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-800">{v.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{v.voterId}</td>
                      <td className="py-3 px-4 text-gray-600">{v.nationalId || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          v.verified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            v.verified ? "bg-green-400" : "bg-yellow-400"
                          }`}></div>
                          {v.verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={voterCurrentPage}
              totalPages={voterTotalPages}
              onPageChange={handleVoterPageChange}
              totalItems={voterTotalItems}
              itemsPerPage={voterItemsPerPage}
              itemsName="voters"
            />
          </>
        )}
      </div>
    </div>
  );

  const CandidatesSection = () => {
    if (showCandidateForm) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-indigo-500/90">Register New Candidate</h2>
            <button
              onClick={() => setShowCandidateForm(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Candidates
            </button>
          </div>

          {/* Candidate Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleCandidateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={candidateFormData.fullName}
                    onChange={handleCandidateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                    placeholder="Enter full name"
                    maxLength={30}
                  />
                  {formErrors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={candidateFormData.email}
                    onChange={handleCandidateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                    placeholder="Enter email address"
                    maxLength={40}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={candidateFormData.password}
                      onChange={handleCandidateInputChange}
                      className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                      placeholder="Enter password"
                      maxLength={30}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                  )}
                </div>

                {/* Party Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="partyName"
                    required
                    value={candidateFormData.partyName}
                    onChange={handleCandidateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                    placeholder="Enter party name"
                    maxLength={15}
                  />
                  {formErrors.partyName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.partyName}</p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="21"
                    max="100"
                    value={candidateFormData.age}
                    onChange={handleCandidateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                    placeholder="Minimum 21 years"
                    maxLength={2}
                  />
                  {formErrors.age && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.age}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    required
                    value={candidateFormData.gender}
                    onChange={handleCandidateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.gender && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.gender}</p>
                  )}
                </div>   

                {/* Political Sign  */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Political Symbol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="politicalSign"
                    onChange={handleFile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                    placeholder="Enter political symbol URL"
                  />
                  {formErrors.politicalSign && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.politicalSign}</p>
                  )}
                </div>

                {/* Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="photo"
                    onChange={handleFile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  />
                  {formErrors.photo && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.photo}</p>
                  )}
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="position"
                    required
                    value={candidateFormData.position}
                    onChange={handleCandidateInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  >
                    <option value="">Select Position</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                  {formErrors.position && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.position}</p>
                  )}
                </div>

                {/* Manifesto */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manifesto <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="manifesto"
                    required
                    value={candidateFormData.manifesto}
                    onChange={handleCandidateInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                    placeholder="Enter candidate's manifesto and promises"
                    maxLength={150}
                  />
                  {formErrors.manifesto && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.manifesto}</p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCandidateForm(false)}
                  className="px-6 py-2 text-white border border-gray-300 bg-gray-500 hover:bg-gray-600 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={candidateLoading}
                  className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {candidateLoading ? "Registering..." : "Register Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (selectedCandidate) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Candidates</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Candidate Photo and Basic Info */}
            <div className="flex flex-col items-center md:items-start space-y-4">
              <img
                src={selectedCandidate.photo || selectedCandidate.profilePic || "/default-profile.png"}
                alt={selectedCandidate.fullName || selectedCandidate.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
              />
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-semibold text-gray-800">{selectedCandidate.fullName || selectedCandidate.name}</h3>
                <p className="text-gray-600">{selectedCandidate.email}</p>
                <p className="text-blue-600 font-medium text-lg mt-1">{selectedCandidate.partyName || selectedCandidate.party}</p>
              </div>
            </div>

            {/* Candidate Details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Position</p>
                  <p className="text-lg font-semibold text-gray-800">{selectedCandidate.position}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Age</p>
                  <p className="text-lg font-semibold text-gray-800">{selectedCandidate.age} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p className="text-lg font-semibold text-gray-800 capitalize">{selectedCandidate.gender}</p>
                </div>
              </div>

              {/* Political Symbol */}
              {selectedCandidate.politicalSign && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">Political Symbol</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedCandidate.politicalSign}
                      alt="Political Symbol"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{selectedCandidate.partyName || selectedCandidate.party}</p>
                      <p className="text-sm text-gray-600">Party Symbol</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manifesto */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Manifesto</p>
                <p className="text-gray-700 leading-relaxed">{selectedCandidate.manifesto || selectedCandidate.bio}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-indigo-500/90">Candidates</h2>
          <button
            onClick={() => setShowCandidateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Candidate
          </button>
        </div>

        {/* Search and Controls */}
        <SearchInput
          value={candidateSearchQuery}
          onChange={setCandidateSearchQuery}
          onSearch={handleCandidateSearch}
          onClear={handleCandidateSearchClear}
          placeholder="Search by candidate name or party..."
          itemsPerPage={candidateItemsPerPage}
          onItemsPerPageChange={handleCandidateItemsPerPageChange}
          itemsPerPageOptions={[6, 9, 12, 15]}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{candidateTotalItems}</p>
                <p className="text-sm text-gray-600">Total Candidates</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center">
              <User className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {candidates.filter(c => c.gender === 'male').length}
                </p>
                <p className="text-sm text-gray-600">Male Candidates</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-500">
            <div className="flex items-center">
              <User className="w-8 h-8 text-pink-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {candidates.filter(c => c.gender === 'female').length}
                </p>
                <p className="text-sm text-gray-600">Female Candidates</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {candidates.filter(c => c.gender === 'other').length}
                </p>
                <p className="text-sm text-gray-600">Other</p>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#0acbae]">Registered Candidates</h3>
            <div className="flex items-center gap-4">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                {candidateTotalItems} total candidates
              </span>
              <span className="text-sm text-gray-600">
                Page {candidateCurrentPage} of {candidateTotalPages}
              </span>
            </div>
          </div>

          {candidatesLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
              <p className="mt-2">Loading candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {candidateSearchQuery ? 'No candidates found matching your search.' : 'No candidates registered yet.'}
              </p>
              <p className="text-gray-400">
                {candidateSearchQuery ? 'Try adjusting your search terms.' : 'Candidates will appear here once registered.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((c) => (
                  <div
                    key={c._id || c.id}
                    className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleCandidateClick(c)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={c.photo || c.profilePic || "/default-profile.png"}
                          alt={c.fullName || c.name}
                          className="w-16 h-16 rounded-full object-cover border"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800">{c.fullName || c.name}</h3>
                          <p className="text-blue-600 font-medium">{c.partyName || c.party}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdatingCandidateId(c._id);
                            handleEditCandidate(c);
                          }}
                          disabled={updatingCandidateId === c._id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                          title="Edit Candidate"
                        >
                          {updatingCandidateId === c._id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Edit2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCandidate(c._id);
                          }}
                          disabled={deletingCandidateId === c._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          title="Delete Candidate"
                        >
                          {deletingCandidateId === c._id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Position:</span> {c.position}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Party:</span> {c.partyName || c.party}
                      </p>
                      {c.politicalSign && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-600">Symbol:</span>
                          <img
                            src={c.politicalSign}
                            alt="Political Symbol"
                            className="w-8 h-8 object-cover rounded"
                          />
                        </div>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {c.manifesto || c.bio}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={candidateCurrentPage}
                totalPages={candidateTotalPages}
                onPageChange={handleCandidatePageChange}
                totalItems={candidateTotalItems}
                itemsPerPage={candidateItemsPerPage}
                itemsName="candidates"
              />
            </>
          )}
        </div>
      </>
    );
  };

  const ElectionsSection = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Elections</h2>
      {elections.length === 0 ? (
        <p>No elections yet.</p>
      ) : (
        <ul className="bg-white p-4 rounded shadow space-y-2">
          {elections.map((e) => (
            <li
              key={e._id || e.id}
              className="border p-3 rounded flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50"
            >
              <div>
                <p className="font-semibold text-blue-900">{e.title}</p>
                <p className="text-sm text-gray-600">
                  Start: {new Date(e.startDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  End: {new Date(e.endDate).toLocaleDateString()}
                </p>
              </div>

              {editingId === e._id ? (
                <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                  <input
                    type="date"
                    value={editedDates.startDate}
                    onChange={(ev) => handleEditedDatesChange('startDate', ev.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    className="border p-1 rounded text-sm"
                  />
                  <input
                    type="date"
                    value={calculateEndDate(editedDates.startDate)}
                    className="border p-1 rounded text-sm bg-gray-100"
                    disabled
                  />
                  <button
                    onClick={() => handleUpdateElection(e._id)}
                    className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-500 hover:bg-gray-600 py-1 px-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={() => {
                      setEditingId(e._id);
                      setEditedDates({
                        startDate: e.startDate.split('T')[0],
                        endDate: e.endDate.split('T')[0],
                      });
                    }}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => handleDeleteElection(e._id)}
                    className="bg-[#ff5154]  hover:bg-[#fc161a] text-white px-3 py-1 rounded "
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "voters":
        return <VotersSection />;
      case "candidates":
        return <CandidatesSection />;
      case "elections":
        return <ElectionsSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#f0e7ed] shadow-sm flex justify-center items-center px-6 py-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="h-18 w-auto object-contain" />
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-400 text-transparent bg-clip-text tracking-wide">
            Electoral Committee Dashboard
          </h1>
        </div>
      </header>

      <div className="flex flex-1 mt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-[#f1e8ff] shadow-md flex flex-col fixed left-0 top-20 bottom-0 text-slate-800">
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSelectedCandidate(null);
                  setShowCandidateForm(false);
                }}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 mt-4 rounded-lg transition-all ${activeSection === section.id
                  ? "bg-indigo-500/90 text-white font-semibold shadow-sm"
                  : "text-indigo-800/90 hover:bg-indigo-300"
                  }`}
              >
                {section.icon}
                <span className="font-medium tracking-wide text-base">
                  {section.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-300 bg-[#f3e8ff]">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-semibold text-base tracking-wide">Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-auto ml-64">
          {renderActiveSection()}
        </main>
      </div>

      {/* Edit Candidate Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setShowEditModal(false)}
          ></div>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 relative z-10 border-2 border-blue-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
              <h3 className="text-2xl font-bold text-blue-800">Edit Candidate</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={editFormData.fullName}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                    maxLength={30}
                  />
                  {editFormErrors.fullName && (
                    <p className="text-red-500 text-sm">{editFormErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                    maxLength={40}
                  />
                  {editFormErrors.email && (
                    <p className="text-red-500 text-sm">{editFormErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={editFormData.password}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter password"
                      maxLength={30}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {editFormErrors.password && (
                    <p className="text-red-500 text-sm">{editFormErrors.password}</p>
                  )}
                </div>

                {/* Party Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Party Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="partyName"
                    required
                    value={editFormData.partyName}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter party name"
                    maxLength={15}
                  />
                  {editFormErrors.partyName && (
                    <p className="text-red-500 text-sm">{editFormErrors.partyName}</p>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="21"
                    max="100"
                    value={editFormData.age}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 21 years"
                    maxLength={2}
                  />
                  {editFormErrors.age && (
                    <p className="text-red-500 text-sm">{editFormErrors.age}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    required
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {editFormErrors.gender && (
                    <p className="text-red-500 text-sm">{editFormErrors.gender}</p>
                  )}
                </div>

                {/* Political Sign */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Political Symbol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="politicalSign"
                    onChange={handleEditFile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  />
                  {editFormData.politicalSign && (
                    <p className="text-green-600 text-sm">Symbol selected</p>
                  )}
                  {editFormErrors.politicalSign && (
                    <p className="text-red-500 text-sm">{editFormErrors.politicalSign}</p>
                  )}
                </div>

                {/* Photo */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Photo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="photo"
                    onChange={handleEditFile}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  />
                  {editFormData.photo && (
                    <p className="text-green-600 text-sm">Photo selected</p>
                  )}
                  {editFormErrors.photo && (
                    <p className="text-red-500 text-sm">{editFormErrors.photo}</p>
                  )}
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="position"
                    required
                    value={editFormData.position}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Position</option>
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                  {editFormErrors.position && (
                    <p className="text-red-500 text-sm">{editFormErrors.position}</p>
                  )}
                </div>
              </div>

              {/* Manifesto */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Manifesto <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="manifesto"
                  required
                  value={editFormData.manifesto}
                  onChange={handleEditInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter candidate's manifesto and promises"
                  maxLength={150}
                />
                {editFormErrors.manifesto && (
                  <p className="text-red-500 text-sm">{editFormErrors.manifesto}</p>
                )}
              </div>

              {/* Current Images Preview */}
              {(editingCandidate?.photo || editingCandidate?.politicalSign) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  {editingCandidate.photo && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-2">Current Photo</p>
                      <img
                        src={editingCandidate.photo}
                        alt="Current candidate"
                        className="w-32 h-32 object-cover rounded-lg mx-auto border"
                      />
                    </div>
                  )}
                  {editingCandidate.politicalSign && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-2">Current Symbol</p>
                      <img
                        src={editingCandidate.politicalSign}
                        alt="Current political symbol"
                        className="w-32 h-32 object-cover rounded-lg mx-auto border"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {editLoading ? "Updating..." : "Update Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectoralCommitteeDashboard;