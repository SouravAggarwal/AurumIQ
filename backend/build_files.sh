# build_files.sh
# Ensure pip is installed/upgraded
python3.9 -m pip install --upgrade pip

# Install dependencies
python3.9 -m pip install -r requirements.txt

# Run migrations (optional during build, often better in entrypoint or manual, but safe for now if DB allows)
# python3.9 manage.py migrate --noinput

# Collect static files
python3.9 manage.py collectstatic --noinput --clear
