<?php
class Article {
    private $conn;
    private $table = "articles";

    public $id;
    public $title;
    public $content;
    public $image_url;
    public $youtube_url;
    public $created_at;
    public $updated_at;
    public $user_id;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Listar todos los artículos
    public function read() {
        $query = "SELECT id, title, content, image_url, youtube_url, created_at 
                  FROM " . $this->table . " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Crear artículo
    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  (title, content, image_url, youtube_url, user_id)
                  VALUES (:title, :content, :image_url, :youtube_url, :user_id)";

        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->content = htmlspecialchars(strip_tags($this->content));
        $this->image_url = htmlspecialchars(strip_tags($this->image_url));
        $this->youtube_url = htmlspecialchars(strip_tags($this->youtube_url));

        // Bind
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":content", $this->content);
        $stmt->bindParam(":image_url", $this->image_url);
        $stmt->bindParam(":youtube_url", $this->youtube_url);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
