import unittest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.core.config import settings
from app.models.entities import User
from app.models.enums import UserRole
from app.api.v1.auth import login, switch_persona, google_login
from app.api.v1.admin import master_vault_authenticate
from app.schemas.api_schemas import LoginRequest, GoogleLoginRequest, MasterVaultLoginRequest, PersonaSwitchRequest

class TestStealthAdminSecurity(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()

    def test_admin_blocked_from_public_login(self):
        admin_user = MagicMock(spec=User)
        admin_user.email = settings.INITIAL_ADMIN_EMAIL
        admin_user.role = UserRole.ADMIN

        # Mock DB returning admin user
        self.db.query().filter().first.return_value = admin_user

        with self.assertRaises(HTTPException) as ctx:
            login(LoginRequest(email=settings.INITIAL_ADMIN_EMAIL, password="password"), self.db)
        
        # Must return generic 401 with standard "Incorrect email or password" (no hint of admin existence)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail, "Incorrect email or password")

    def test_switch_persona_blocks_admin(self):
        admin_user = MagicMock(spec=User)
        admin_user.email = settings.INITIAL_ADMIN_EMAIL
        admin_user.role = UserRole.ADMIN
        self.db.query().filter().first.return_value = admin_user

        with self.assertRaises(HTTPException) as ctx:
            switch_persona(PersonaSwitchRequest(email=settings.INITIAL_ADMIN_EMAIL), self.db)
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertIn("not found", ctx.exception.detail)

    def test_google_login_rejects_master_admin_on_public_endpoint(self):
        req = GoogleLoginRequest(
            credential="dummy_token",
            email=settings.INITIAL_ADMIN_EMAIL,
            full_name="Master Jedi"
        )
        with self.assertRaises(HTTPException) as ctx:
            google_login(req, self.db)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("cannot sign in via public Google portal", ctx.exception.detail)

    def test_vault_authenticate_fails_with_invalid_credentials(self):
        req = MasterVaultLoginRequest(
            admin_id="intruder@example.com",
            master_key=settings.ADMIN_ACCESS_KEY
        )
        with self.assertRaises(HTTPException) as ctx:
            master_vault_authenticate(req, self.db)
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertEqual(ctx.exception.detail, "Security gateway endpoint not recognized.")

    def test_vault_authenticate_fails_with_invalid_master_key(self):
        admin_user = MagicMock(spec=User)
        admin_user.email = settings.INITIAL_ADMIN_EMAIL
        admin_user.role = UserRole.ADMIN
        admin_user.hashed_password = "hashed_pass"
        self.db.query().filter().first.return_value = admin_user

        with patch("app.api.v1.admin.verify_password", return_value=False):
            req = MasterVaultLoginRequest(
                admin_id=settings.INITIAL_ADMIN_EMAIL,
                master_key="WRONG_KEY"
            )
            with self.assertRaises(HTTPException) as ctx:
                master_vault_authenticate(req, self.db)
            self.assertEqual(ctx.exception.status_code, 401)
            self.assertEqual(ctx.exception.detail, "Vault clearance denied. Access key invalid.")

    def test_vault_authenticate_succeeds_with_correct_keys(self):
        admin_user = MagicMock(spec=User)
        admin_user.id = "admin-uuid"
        admin_user.email = settings.INITIAL_ADMIN_EMAIL
        admin_user.role = UserRole.ADMIN
        admin_user.hashed_password = "hashed_pass"

        self.db.query().filter().first.return_value = admin_user

        with patch("app.api.v1.admin.verify_password", return_value=True):
            req = MasterVaultLoginRequest(
                admin_id=settings.INITIAL_ADMIN_EMAIL,
                master_key="any_valid_pwd",
                access_passcode=settings.ADMIN_ACCESS_KEY
            )
            res = master_vault_authenticate(req, self.db)
            self.assertIn("access_token", res)
            self.assertEqual(res["user"].email, settings.INITIAL_ADMIN_EMAIL)
            self.assertEqual(res["user"].role, UserRole.ADMIN)
