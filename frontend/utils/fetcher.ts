export const fetcher = async ([url, token]: [string, string | null]) => {
    if (!token) {
        throw new Error('Not authorized')
    }
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorInfo;

        if (contentType?.includes('application/json')) {
            errorInfo = await response.json();
        } else {
            const text = await response.text();
            console.error('❌ Non-JSON error response:', text.substring(0, 500));
            errorInfo = { message: `HTTP ${response.status}` };
        }

        throw new Error(errorInfo.message || 'An error occurred while fetching the data.');
    }

    return response.json()
  }