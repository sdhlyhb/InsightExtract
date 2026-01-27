"""Pytest configuration and fixtures for integration tests."""
import asyncio
import os
from typing import AsyncGenerator, Generator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app


# Test database URL
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/insightextract_test"
)

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
)

TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()
    
    # Drop tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database session override."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_pdf_content() -> bytes:
    """Create a minimal valid PDF for testing."""
    # Minimal PDF structure
    pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000074 00000 n 
0000000131 00000 n 
0000000359 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
452
%%EOF
"""
    return pdf_content


@pytest.fixture
def sample_text() -> str:
    """Sample text for analysis testing."""
    return """
Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that focuses on building systems 
that can learn from data. The main types of machine learning include supervised learning, 
unsupervised learning, and reinforcement learning.

Supervised Learning
Supervised learning involves training a model on labeled data. Common algorithms include:
- Linear Regression: Used for predicting continuous values
- Logistic Regression: Used for binary classification
- Decision Trees: Can be used for both regression and classification

Unsupervised Learning
Unsupervised learning works with unlabeled data to find patterns. Key techniques include:
- Clustering: Grouping similar data points
- Dimensionality Reduction: Reducing the number of features
- Association Rules: Finding relationships between variables

Key Terms:
- Model: A mathematical representation learned from data
- Training: The process of teaching a model using data
- Features: Input variables used for prediction
- Labels: Output variables we want to predict

Conclusion
Machine learning has revolutionized many industries including healthcare, finance, and 
technology. Understanding these fundamental concepts is essential for any data scientist.
"""
