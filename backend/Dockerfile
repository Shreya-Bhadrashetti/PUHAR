FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
COPY . /app
ENV PYTHONPATH=/app
RUN mkdir -p /app/database
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
