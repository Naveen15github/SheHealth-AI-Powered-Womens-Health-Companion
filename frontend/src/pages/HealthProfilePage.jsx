import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProfile } from '../services/apiService';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './HealthProfilePage.css';

const HEALTH_CONDITIONS = ['PCOS', 'Thyroid', 'Endometriosis', 'Other'];

function HealthProfilePage() {
  const navigate = useNavigate();
  const [age, setAge] = useState('');
  const [healthConditions, setHealthConditions] = useState([]);
  const [ageError, setAgeError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleCondition(condition) {
    setHealthConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAgeError('');
    setError('');

    if (!age) {
      setAgeError('Please enter your age.');
      return;
    }

    setLoading(true);
    try {
      await saveProfile({
        age: Number(age),
        healthConditions,
      });
      navigate('/dashboard');
    } catch (err) {
      setError('Something went wrong saving your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <Navbar />
      <div className="page-container profile-container">
        <h1 className="profile-heading">Tell us about yourself</h1>
        <p className="profile-subtitle">This helps us personalise your experience</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="age">
              Age <span className="text-primary" aria-hidden="true">*</span>
            </label>
            <input
              id="age"
              type="number"
              min="1"
              max="120"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={`input-field${ageError ? ' input-field--error' : ''}`}
              placeholder="e.g. 28"
              aria-required="true"
              aria-describedby={ageError ? 'age-error' : undefined}
            />
            {ageError && <p id="age-error" className="auth-card__field-error">{ageError}</p>}
          </div>

          <div className="auth-card__field">
            <span className="auth-card__label" id="conditions-label">Health conditions (select all that apply)</span>
            <div className="profile-checkbox-group" role="group" aria-labelledby="conditions-label">
              {HEALTH_CONDITIONS.map((condition) => (
                <label key={condition} className="profile-checkbox-label">
                  <input
                    type="checkbox"
                    className="profile-checkbox"
                    checked={healthConditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                    aria-label={condition}
                  />
                  {condition}
                </label>
              ))}
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          {loading ? (
            <LoadingSpinner />
          ) : (
            <button type="submit" className="btn-primary btn-full">
              Save &amp; continue
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default HealthProfilePage;
