export type ClientOptions = {
  authorization: string;
  url: string;
};

export class Client {
  private authorization: string;
  private url: string;

  constructor({ authorization, url }: ClientOptions) {
    this.authorization = authorization;
    this.url = `${url}`;
  }

  private getHeaders() {
    const headers = {
      'content-type': 'application/json',
      Authorization: this.authorization
    };

    return headers;
  }

  async post<T>(body: T): Promise<void> {
    await fetch(this.url, {
      body: JSON.stringify(body),
      headers: this.getHeaders(),
      method: 'POST'
    });
  }
}
