package service

import (
	"encoding/json"
	"errors"

	"github.com/labubu-daydayone/go_cmdb_web/backend/internal/database"
	"github.com/labubu-daydayone/go_cmdb_web/backend/internal/models"
)

var (
	ErrTaskNotFound = errors.New("task not found")
	ErrInvalidTaskType = errors.New("invalid task type")
	ErrInvalidTaskStatus = errors.New("invalid task status")
)

// AgentTaskService handles agent task operations
type AgentTaskService struct{}

// NewAgentTaskService creates a new agent task service
func NewAgentTaskService() *AgentTaskService {
	return &AgentTaskService{}
}

// CreateTaskRequest represents a request to create an agent task
type CreateTaskRequest struct {
	NodeID  int                    `json:"node_id" binding:"required"`
	Type    string                 `json:"type" binding:"required"`
	Payload map[string]interface{} `json:"payload" binding:"required"`
}

// UpdateTaskStatusRequest represents a request to update task status
type UpdateTaskStatusRequest struct {
	Status    string  `json:"status" binding:"required"`
	LastError *string `json:"last_error"`
}

// CreateTask creates a new agent task
func (s *AgentTaskService) CreateTask(req CreateTaskRequest) (*models.AgentTask, error) {
	// Validate task type
	validTypes := map[string]bool{
		"purge_cache":  true,
		"apply_config": true,
		"reload":       true,
	}
	if !validTypes[req.Type] {
		return nil, ErrInvalidTaskType
	}

	// Verify node exists
	var node models.Node
	if err := database.DB.First(&node, req.NodeID).Error; err != nil {
		return nil, errors.New("node not found")
	}

	// Convert payload to JSON string
	payloadJSON, err := json.Marshal(req.Payload)
	if err != nil {
		return nil, err
	}

	// Create task
	task := models.AgentTask{
		NodeID:  req.NodeID,
		Type:    req.Type,
		Payload: string(payloadJSON),
		Status:  "pending",
	}

	if err := database.DB.Create(&task).Error; err != nil {
		return nil, err
	}

	return &task, nil
}

// CreateBatchTasks creates multiple agent tasks for multiple nodes
func (s *AgentTaskService) CreateBatchTasks(nodeIDs []int, taskType string, payload map[string]interface{}) ([]models.AgentTask, error) {
	// Validate task type
	validTypes := map[string]bool{
		"purge_cache":  true,
		"apply_config": true,
		"reload":       true,
	}
	if !validTypes[taskType] {
		return nil, ErrInvalidTaskType
	}

	// Convert payload to JSON string
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	// Create tasks for all nodes
	tasks := make([]models.AgentTask, 0, len(nodeIDs))
	for _, nodeID := range nodeIDs {
		// Verify node exists
		var node models.Node
		if err := database.DB.First(&node, nodeID).Error; err != nil {
			continue // Skip invalid nodes
		}

		task := models.AgentTask{
			NodeID:  nodeID,
			Type:    taskType,
			Payload: string(payloadJSON),
			Status:  "pending",
		}

		if err := database.DB.Create(&task).Error; err != nil {
			continue // Skip failed creations
		}

		tasks = append(tasks, task)
	}

	if len(tasks) == 0 {
		return nil, errors.New("no tasks created")
	}

	return tasks, nil
}

// GetPendingTasks returns all pending tasks for a specific node
func (s *AgentTaskService) GetPendingTasks(nodeID int) ([]models.AgentTask, error) {
	var tasks []models.AgentTask
	if err := database.DB.Where("node_id = ? AND status = ?", nodeID, "pending").
		Order("id ASC").
		Find(&tasks).Error; err != nil {
		return nil, err
	}

	return tasks, nil
}

// GetTaskByID returns a task by ID
func (s *AgentTaskService) GetTaskByID(id int) (*models.AgentTask, error) {
	var task models.AgentTask
	if err := database.DB.First(&task, id).Error; err != nil {
		return nil, ErrTaskNotFound
	}

	return &task, nil
}

// ListTasks returns a paginated list of tasks
func (s *AgentTaskService) ListTasks(nodeID *int, status *string, page, pageSize int) ([]models.AgentTask, int64, error) {
	var tasks []models.AgentTask
	var total int64

	query := database.DB.Model(&models.AgentTask{})

	// Filter by node ID
	if nodeID != nil {
		query = query.Where("node_id = ?", *nodeID)
	}

	// Filter by status
	if status != nil {
		query = query.Where("status = ?", *status)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Paginate
	offset := (page - 1) * pageSize
	if err := query.Order("id DESC").Offset(offset).Limit(pageSize).Find(&tasks).Error; err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

// UpdateTaskStatus updates the status of a task
func (s *AgentTaskService) UpdateTaskStatus(id int, req UpdateTaskStatusRequest) error {
	// Validate status
	validStatuses := map[string]bool{
		"pending": true,
		"running": true,
		"success": true,
		"failed":  true,
	}
	if !validStatuses[req.Status] {
		return ErrInvalidTaskStatus
	}

	// Get task
	var task models.AgentTask
	if err := database.DB.First(&task, id).Error; err != nil {
		return ErrTaskNotFound
	}

	// Update status
	updates := map[string]interface{}{
		"status": req.Status,
	}

	// Update error message if provided
	if req.LastError != nil {
		updates["last_error"] = *req.LastError
	}

	if err := database.DB.Model(&task).Updates(updates).Error; err != nil {
		return err
	}

	return nil
}

// DeleteTask deletes a task
func (s *AgentTaskService) DeleteTask(id int) error {
	result := database.DB.Delete(&models.AgentTask{}, id)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrTaskNotFound
	}

	return nil
}
