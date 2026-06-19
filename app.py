import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Atom Feed namespace mapping
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        releases = []
        
        for entry in root.findall('atom:entry', ns):
            # Extract basic fields
            title_elem = entry.find('atom:title', ns)
            title = title_elem.text.strip() if title_elem is not None and title_elem.text else "Release Update"
            
            updated_elem = entry.find('atom:updated', ns)
            published = updated_elem.text.strip() if updated_elem is not None and updated_elem.text else ""
            
            # Extract link element (prefer rel="alternate" or any link)
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            if link_elem is None:
                link_elem = entry.find("atom:link", ns)
            link = link_elem.attrib.get('href', '').strip() if link_elem is not None else ""
            
            # Extract content HTML (usually wrapped in CDATA)
            content_elem = entry.find('atom:content', ns)
            content = content_elem.text.strip() if content_elem is not None and content_elem.text else ""
            
            releases.append({
                'title': title,
                'published': published,
                'content': content,
                'link': link
            })
            
        return releases
    except Exception as e:
        print(f"Error fetching or parsing feed: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def api_releases():
    releases = fetch_and_parse_feed()
    return jsonify(releases)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
