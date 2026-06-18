"""
Spectroscopic observation thread.

All wavelengths in nanometres. Velocities in km/s. Fluxes normalised to continuum.
This is the raw observational input that RAPIDS pre-resolves before HERMES carries
it into the cognitive pipeline.
"""

from pydantic import BaseModel, Field


class Observation(BaseModel):
    """
    Single-thread spectroscopic observation record.

    The minimum required fields are the two wavelengths and the two FWHM values.
    All flux and diagnostic fields default to physically neutral values so that
    a partial observation still resolves — RAPIDS never refuses a thread.
    """

    # ── Line identification ───────────────────────────────────────────────────
    peak_wavelength_nm: float = Field(
        ...,
        description="Observed peak wavelength of the target line (nm).",
    )
    rest_wavelength_nm: float = Field(
        ...,
        description="Rest-frame wavelength for the target transition (nm). "
                    "E.g. H-alpha = 656.28, H-beta = 486.13.",
    )

    # ── Line profile ──────────────────────────────────────────────────────────
    fwhm_kms: float = Field(
        ...,
        description="Observed full-width at half-maximum of the line profile (km/s).",
    )
    expected_fwhm_kms: float = Field(
        ...,
        gt=0,
        description="Expected FWHM for this line type and source class (km/s). "
                    "Used to compute the FWHM ratio feature.",
    )

    # ── Balmer flux inputs ────────────────────────────────────────────────────
    h_alpha_flux: float = Field(
        default=1.0,
        description="H-alpha (656.28 nm) integrated line flux, normalised to continuum. "
                    "Default 1.0 → pure case-B ratio when combined with h_beta_flux = 0.35.",
    )
    h_beta_flux: float = Field(
        default=0.35,
        gt=0,
        description="H-beta (486.13 nm) integrated line flux, normalised to continuum. "
                    "Must be > 0. Default 0.35 gives H-alpha/H-beta ≈ 2.86 (case B).",
    )

    # ── Auxiliary diagnostics ─────────────────────────────────────────────────
    he_ii_4686_present: bool = Field(
        default=False,
        description="He II λ4686 Å high-ionisation line detected. "
                    "Signals accretion or hard-UV source.",
    )
    temporal_variability_days: float = Field(
        default=0.0,
        ge=0.0,
        description="Photometric variability timescale in days. "
                    "0 = no measurable variability in the observation window.",
    )
    blue_absorption_velocity: float = Field(
        default=0.0,
        description="Blueshifted absorption centroid velocity (km/s). "
                    "Negative values indicate outflow (blueward of rest).",
    )
    x_ray_association: float = Field(
        default=0.0,
        ge=0.0,
        description="X-ray flux association factor (dimensionless, 0 = no association). "
                    "Higher values indicate co-spatial X-ray source.",
    )
    radio_flux_mjy: float = Field(
        default=0.0,
        ge=0.0,
        description="Radio continuum flux density (mJy). "
                    "0 = below detection threshold.",
    )
